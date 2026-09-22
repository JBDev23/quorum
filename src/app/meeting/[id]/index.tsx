import { Redirect } from "expo-router";

import { useMeeting } from "./_layout";

export default function MeetingIndexRedirect() {
  const { role, status, meetingId } = useMeeting();

  if (role === "organizer") {
    return <Redirect href={`/meeting/${meetingId}/organizer`} />;
  }

  if (status === "accreditation") {
    return <Redirect href={`/meeting/${meetingId}/member/accreditation`} />;
  }

  return <Redirect href={`/meeting/${meetingId}/member`} />;
}
