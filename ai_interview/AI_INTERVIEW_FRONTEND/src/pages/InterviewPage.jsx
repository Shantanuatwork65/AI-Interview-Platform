import { useEffect, useState } from "react";
import { APP_CONSTANTS } from "../util/constant";
import { submitAPI, reportAPI, endInterviewAPI } from "../services/interview";
import { playAudio } from "../util/audio";
import StartInterview from "../components/StartInterview";
import Interview from "../components/Interview";
import Report from "../components/Report";
import { useSpeechToText } from "../hooks/useSpeechToText";
import "../assests/css/InterviewPage.css";

const InterviewPage = () => {
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState(APP_CONSTANTS.IDLE);
  const [question, setQuestion] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const onAutoSubmit = async (finalText) => {
    stopListening();

    if (!finalText.trim()) {
      return;
    }

    const payload = {
      session_id: sessionId,
      answer: finalText.trim(),
      skip: false,
    };

    try {
      const data = await submitAPI(payload);

      if (data.interviewEnded) {
        await finishInterview();
        return;
      }

      setQuestion(data.nextQuestion);
      setStatus(APP_CONSTANTS.ASKING);
    } catch (error) {
      console.error("Unable to submit answer:", error);
      setStatus(APP_CONSTANTS.LISTENING);
    }
  };

  const { startListening, stopListening } = useSpeechToText(onAutoSubmit);

  const finishInterview = async () => {
    setLoading(true);
    setStatus(APP_CONSTANTS.COMPLETED);
    try {
      const data = await reportAPI(sessionId);
      setReport(data?.result || data || null);
    } catch (error) {
      console.error("Unable to fetch interview report:", error);
    } finally {
      setLoading(false);
    }
  };

  const skipQuestion = async () => {
    stopListening();

    if (!sessionId) {
      return;
    }

    const payload = {
      session_id: sessionId,
      answer: "",
      skip: true,
    };

    try {
      const data = await submitAPI(payload);

      if (data.interviewEnded) {
        await finishInterview();
      } else {
        setQuestion(data.nextQuestion);
        setStatus(APP_CONSTANTS.ASKING);
      }
    } catch (error) {
      console.error("Unable to skip question:", error);
      setStatus(APP_CONSTANTS.LISTENING);
    }
  };

  const endInterview = async () => {
    stopListening();
    try {
      await endInterviewAPI(sessionId);
    } catch (error) {
      console.error("Unable to mark interview as ended:", error);
    }
    await finishInterview();
  };

  useEffect(() => {
    if (status === APP_CONSTANTS.ASKING) {
      playAudio(question, () => {
        setStatus(APP_CONSTANTS.LISTENING);
        startListening();
      });
    }
  }, [status, question, startListening]);

  const startInterview = async (data, session_id) => {
    setLoading(true);
    try {
      setSessionId(session_id);
      setQuestion(data.firstQuestion);
      setStatus(APP_CONSTANTS.INTRO);

      playAudio(data.introText, () => {
        setLoading(false);
        setStatus(APP_CONSTANTS.ASKING);
      });
    } catch (error) {
      console.error("Unable to start interview:", error);
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <div>Loading...</div>}

      {status === APP_CONSTANTS.IDLE && (
        <StartInterview onClick={startInterview} />
      )}

      {(status === APP_CONSTANTS.ASKING ||
        status === APP_CONSTANTS.LISTENING) && (
        <Interview
          question={question}
          status={status}
          skipQuestion={skipQuestion}
          endInterview={endInterview}
        />
      )}

      {status === APP_CONSTANTS.COMPLETED && <Report report={report} />}
    </>
  );
};

export default InterviewPage;
