import { useMeeting } from "../_layout";
import { MeetingClosedResults } from "@/components/voting/MeetingClosedResults";

export default function OrganizerResultsScreen() {
  const { meetingId, status } = useMeeting();
  return <MeetingClosedResults meetingId={meetingId} status={status} />;
}
