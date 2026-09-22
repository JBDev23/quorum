import { useMeeting } from "../_layout";
import { VotingScreen } from "@/components/voting/VotingScreen";

export default function OrganizerVotingScreen() {
  const { meetingId, status } = useMeeting();
  return (
    <VotingScreen meetingId={meetingId} status={status} isOrganizer />
  );
}
