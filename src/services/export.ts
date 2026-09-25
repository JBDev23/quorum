import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";
import { fetchClosedPolls, getPollResults, type Poll } from "./polls";
import i18n from "@/lib/i18n";

export type ExportOptions = {
  includeResults: boolean;
  includeAttendance: boolean;
  includeAudit: boolean; // Hashes/timestamps
};

export type ExportFormat = "pdf" | "csv";

async function fetchExportData(meetingId: string, options: ExportOptions) {
  // 1. Meeting Details
  const { data: meetingData, error: meetingError } = await supabase
    .from("meetings")
    .select("*, groups(name)")
    .eq("id", meetingId)
    .single();

  if (meetingError || !meetingData) throw new Error(i18n.t("services.export.load_meeting_error"));

  const groupName = Array.isArray(meetingData.groups)
    ? meetingData.groups[0]?.name
    : (meetingData.groups as any)?.name || i18n.t("services.export.group");

  // 2. Polls & Results
  let pollsWithResults: Array<Poll & { results: Record<string, number>; blankVotes: number; totalVotes: number }> = [];
  if (options.includeResults || options.includeAudit) {
    const closedPolls = await fetchClosedPolls(meetingId);
    pollsWithResults = await Promise.all(
      closedPolls.map(async (poll) => {
        const results = await getPollResults(poll.id);
        return { ...poll, ...results };
      })
    );
  }

  // 3. Attendance
  let attendance: Array<{ fullName: string; accreditedAt: string | null; userId: string }> = [];
  if (options.includeAttendance || options.includeAudit) {
    const { data: groupMembers, error: groupMembersError } = await supabase
      .from("group_members")
      .select("user_id, users(first_name, last_name)")
      .eq("group_id", meetingData.group_id);

    if (groupMembersError) console.error("Error fetching group members:", groupMembersError);

    const { data: attendances, error: attendancesError } = await supabase
      .from("meeting_attendances")
      .select("user_id")
      .eq("meeting_id", meetingId);

    if (attendancesError) console.error("Error fetching attendances:", attendancesError);

    const attendancesSet = new Set(attendances?.map((a) => a.user_id));

    // We only list those who actually accredited if we only want attendance list for the meeting
    const accreditedOnly = (groupMembers || [])
      .filter((m) => attendancesSet.has(m.user_id))
      .map((m: any) => {
        const f = m.users?.first_name || "";
        const l = m.users?.last_name || "";
        return {
          userId: m.user_id,
          fullName: [f, l].filter(Boolean).join(" ") || "Usuario Desconocido",
          accreditedAt: null,
        };
      });

    attendance = accreditedOnly;
  }

  // 4. Audit / Participations (if requested)
  let auditLogs: Array<{ pollTitle: string; fullName: string; votedAt: string }> = [];
  if (options.includeAudit && pollsWithResults.length > 0) {
    // For each poll, get participations
    const pollIds = pollsWithResults.map((p) => p.id);
    const { data: participations } = await supabase
      .from("poll_participations")
      .select("poll_id, user_id, voted_at")
      .in("poll_id", pollIds);

    const attendanceMap = new Map(attendance.map((a: any) => [a.userId, a.fullName]));
    const pollMap = new Map(pollsWithResults.map((p) => [p.id, p.title]));

    auditLogs = (participations || [])
      .map((p) => ({
        pollTitle: pollMap.get(p.poll_id) || i18n.t("services.export.unknown"),
        fullName: attendanceMap.get(p.user_id) || i18n.t("services.export.anonymous"),
        votedAt: p.voted_at,
      }))
      // Sort by voted_at ascending
      .sort((a, b) => new Date(a.votedAt).getTime() - new Date(b.votedAt).getTime());
  }

  return {
    meetingTitle: meetingData.title,
    groupName,
    startDate: meetingData.start_date,
    endDate: meetingData.end_date,
    polls: pollsWithResults,
    attendance,
    auditLogs,
  };
}

export async function exportMeetingResults(
  meetingId: string,
  format: ExportFormat,
  options: ExportOptions
) {
  const data = await fetchExportData(meetingId, options);

  if (format === "csv") {
    await exportCSV(data, options);
  } else {
    await exportPDF(data, options);
  }
}

async function exportCSV(data: any, options: ExportOptions) {
  let csvContent = "";

  const appendSection = (title: string, csvData: any) => {
    csvContent += `\n--- ${title.toUpperCase()} ---\n\n`;
    csvContent += Papa.unparse(csvData) + "\n";
  };

  appendSection(i18n.t("services.export.meeting_details"), [{
    [i18n.t("services.export.assembly")]: data.meetingTitle,
    [i18n.t("services.export.group")]: data.groupName,
    [i18n.t("services.export.date")]: new Date(data.startDate).toLocaleString("es-ES"),
  }]);

  if (options.includeResults && data.polls.length > 0) {
    const resultsData = data.polls.flatMap((poll: any) => {
      const rows = (poll.poll_options || []).map((opt: any) => ({
        [i18n.t("services.export.poll")]: poll.title,
        [i18n.t("services.export.option")]: opt.text,
        [i18n.t("services.export.votes")]: poll.results[opt.id] || 0,
      }));
      if (poll.blankVotes > 0) {
        rows.push({ [i18n.t("services.export.poll")]: poll.title, [i18n.t("services.export.option")]: i18n.t("services.export.blank_votes"), [i18n.t("services.export.votes")]: poll.blankVotes });
      }
      return rows;
    });
    appendSection(i18n.t("services.export.voting_results"), resultsData);
  }

  if (options.includeAttendance && data.attendance.length > 0) {
    const attendanceData = data.attendance.map((a: any) => ({
      [i18n.t("services.export.name")]: a.fullName,
      [i18n.t("services.export.accredited_on")]: a.accreditedAt ? new Date(a.accreditedAt).toLocaleString("es-ES") : i18n.t("services.export.yes"),
    }));
    appendSection(i18n.t("services.export.accredited_attendees"), attendanceData);
  }

  if (options.includeAudit && data.auditLogs.length > 0) {
    const auditData = data.auditLogs.map((log: any) => ({
      [i18n.t("services.export.poll")]: log.pollTitle,
      [i18n.t("services.export.voter")]: log.fullName,
      [i18n.t("services.export.vote_time")]: new Date(log.votedAt).toLocaleString("es-ES"),
    }));
    appendSection(i18n.t("services.export.audit_log"), auditData);
  }

  const timestamp = Date.now();
  const csvFile = new File(Paths.document, `${i18n.t("services.export.results_prefix")}${data.meetingTitle.replace(/\s+/g, "_")}_${timestamp}.csv`);
  csvFile.write(csvContent.trim());
  await shareFile(csvFile.uri, "text/csv");
}

async function exportPDF(data: any, options: ExportOptions) {
  const lightColors = {
    primary: "#09090b",
    secondary: "#18181b",
    background: "#ffffff",
    card: "#fafafa",
    text: "#09090b",
    mutedText: "#71717a",
    border: "#e4e4e7",
  };

  const formattedDate = new Date(data.startDate).toLocaleString("es-ES", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: ${lightColors.text};
          background-color: ${lightColors.background};
          padding: 40px;
          line-height: 1.6;
        }
        h1 { color: ${lightColors.primary}; font-size: 28px; margin-bottom: 5px; }
        h2 { color: ${lightColors.secondary}; font-size: 20px; margin-top: 30px; border-bottom: 2px solid ${lightColors.border}; padding-bottom: 5px; }
        h3 { color: ${lightColors.primary}; font-size: 16px; margin-top: 20px; }
        p { color: ${lightColors.mutedText}; font-size: 14px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid ${lightColors.border}; padding: 10px; text-align: left; font-size: 14px; }
        th { background-color: ${lightColors.card}; color: ${lightColors.primary}; font-weight: bold; }
        .footer { margin-top: 50px; font-size: 12px; color: ${lightColors.mutedText}; text-align: center; border-top: 1px solid ${lightColors.border}; padding-top: 20px; }
        .bar-container { width: 100%; background-color: ${lightColors.border}; border-radius: 4px; overflow: hidden; margin-top: 5px; height: 12px; }
        .bar { background-color: ${lightColors.primary}; height: 100%; }
        .bar-blank { background-color: ${lightColors.mutedText}; height: 100%; }
      </style>
    </head>
    <body>
      <h1>${data.meetingTitle}</h1>
      <p>${i18n.t("voting.hardcoded.group")} <strong>${data.groupName}</strong><br>${i18n.t("voting.hardcoded.date")} ${formattedDate}</p>
  `;

  if (options.includeResults && data.polls.length > 0) {
    html += `<h2>${i18n.t("voting.hardcoded.voting_results")}</h2>`;
    data.polls.forEach((poll: any) => {
      html += `<h3>${poll.title}</h3>`;
      if (poll.totalVotes === 0) {
        html += `<p>${i18n.t("voting.hardcoded.no_votes_ballot")}</p>`;
        return;
      }

      html += `<table>
        <tr>
          <th>${i18n.t("voting.hardcoded.option")}</th>
          <th style="width: 100px;">${i18n.t("voting.hardcoded.votes")}</th>
          <th style="width: 80px;">%</th>
          <th>${i18n.t("voting.hardcoded.proportion")}</th>
        </tr>`;

      const sortedOptions = [...(poll.poll_options || [])].sort((a, b) => {
        return (poll.results[b.id] || 0) - (poll.results[a.id] || 0);
      });

      sortedOptions.forEach((opt: any) => {
        const count = poll.results[opt.id] || 0;
        const percent = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;
        html += `
          <tr>
            <td>${opt.text}</td>
            <td>${count}</td>
            <td>${percent}%</td>
            <td>
              <div class="bar-container"><div class="bar" style="width: ${percent}%;"></div></div>
            </td>
          </tr>
        `;
      });

      if (poll.blankVotes > 0) {
        const percent = Math.round((poll.blankVotes / poll.totalVotes) * 100);
        html += `
          <tr>
            <td><em>${i18n.t("voting.hardcoded.blank")}</em></td>
            <td>${poll.blankVotes}</td>
            <td>${percent}%</td>
            <td>
              <div class="bar-container"><div class="bar-blank" style="width: ${percent}%;"></div></div>
            </td>
          </tr>
        `;
      }

      html += `</table><p style="margin-top: 8px; text-align: right; color: ${lightColors.primary}; font-weight: bold;">Total votos: ${poll.totalVotes}</p>`;
    });
  }

  if (options.includeAttendance && data.attendance.length > 0) {
    html += `<h2>${i18n.t("voting.hardcoded.accredited_attendees")}</h2>`;
    html += `<table>
      <tr>
        <th>${i18n.t("voting.hardcoded.full_name")}</th>
      </tr>`;
    data.attendance.forEach((a: any) => {
      html += `
        <tr>
          <td>${a.fullName}</td>
        </tr>
      `;
    });
    html += `</table><p style="margin-top: 8px; text-align: right;">Total asistentes: ${data.attendance.length}</p>`;
  }

  if (options.includeAudit && data.auditLogs.length > 0) {
    html += `<h2>${i18n.t("voting.hardcoded.audit_log")}</h2>`;
    html += `<table>
      <tr>
        <th>${i18n.t("voting.hardcoded.poll")}</th>
        <th>${i18n.t("voting.hardcoded.voter")}</th>
        <th>${i18n.t("voting.hardcoded.vote_time")}</th>
      </tr>`;
    data.auditLogs.forEach((log: any) => {
      html += `
        <tr>
          <td>${log.pollTitle}</td>
          <td>${log.fullName}</td>
          <td>${new Date(log.votedAt).toLocaleString("es-ES")}</td>
        </tr>
      `;
    });
    html += `</table>`;
  }

  html += `
      <div class="footer">
        ${i18n.t("services.export.generated_by")}${new Date().toLocaleString("es-ES")}
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const printedFile = new File(uri);
  const timestamp = Date.now();
  const newFile = new File(Paths.document, `${i18n.t("services.export.results_prefix")}${data.meetingTitle.replace(/\s+/g, "_")}_${timestamp}.pdf`);

  await printedFile.move(newFile);

  await shareFile(newFile.uri, "application/pdf");
}

async function shareFile(uri: string, mimeType: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error(i18n.t("services.export.share_unavailable"));
  }

  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: i18n.t("services.export.share_title"),
  });
}
