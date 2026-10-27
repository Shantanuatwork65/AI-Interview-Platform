import axios from "axios";

const BASE_URL = "http://localhost:8000/interview";

export const generateQuestionsAPI = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/generate-questions`, formData);
    return response.data;
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw error;
  }
};

export const startInterviewAPI = async (sessionId) => {
  try {
    const response = await axios.get(`${BASE_URL}/start/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error starting interview:", error);
    throw error;
  }
};

export const submitAPI = async (payload) => {
  try {
    const response = await axios.post(`${BASE_URL}/submit`, payload);
    return response.data;
  } catch (error) {
    console.error("Error submitting answer:", error);
    throw error;
}
};


export const reportAPI = async (sessionId) => {
  try {
    const response = await axios.get(`${BASE_URL}/report/${sessionId}`);
    return response.data;
  }
  catch (error) {
    console.error("Error fetching report:", error);
    throw error;
}
};



export const endInterviewAPI = async (sessionId) => {
  try {
    const response = await axios.post(`${BASE_URL}/end/${sessionId}`);
    return response.data;
  }
  catch (error) {
    console.error("Error ending interview:", error);
    throw error;
}
};


