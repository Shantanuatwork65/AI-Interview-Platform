import "../assests/css/Interview.css";
import speaking from "../assests/images/speaking.gif";
import listening from "../assests/images/listening.gif";
import { APP_CONSTANTS } from "../util/constant";

const Interview = ({ skipQuestion, endInterview, status }) => {
  return (
    <>
      <div className="interview-container">
        {/* Col1: AI Bot */}
        <div className="interview-column">
          <div className="bot-section">
            <h2>AI Interviewer</h2>
            {status === APP_CONSTANTS.ASKING && (
              <div className="gif-placeholder">
                <img src={speaking} alt="Bot Speaking..." />
              </div>
            )}
            {status !== APP_CONSTANTS.ASKING && (
              <div className="gif-placeholder-gray"></div>
            )}
          </div>
        </div>

        {/* Col2: Buttons */}
        <div className="interview-column controls-section">
          <button onClick={skipQuestion} className="control-btn skip-btn">
            Skip Question
          </button>
          <button onClick={endInterview} className="control-btn end-btn">
            End Interview
          </button>
        </div>

        {/* Col3: Your Mic Image */}
        <div className="interview-column">
          <div className="candidate-section">
            <h2>You</h2>
            {status === APP_CONSTANTS.LISTENING && (
              <div className="gif-placeholder">
                <img src={listening} alt="You are Speaking..." />
              </div>
            )}
            {status !== APP_CONSTANTS.LISTENING && (
              <div className="gif-placeholder-gray"></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Interview;
