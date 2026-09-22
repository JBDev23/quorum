import { Redirect } from "expo-router";

import { useMeeting } from "../_layout";
import { VotingScreen } from "@/components/voting/VotingScreen";

export default function MemberVotingScreen() {
  const { meetingId, status, startDate } = useMeeting();

  if (status === "closed") {
    return <Redirect href={`/meeting/${meetingId}/member/results`} />;
  }

  return (
    <VotingScreen
      meetingId={meetingId}
      status={status}
      startDate={startDate}
    />
  );
}
