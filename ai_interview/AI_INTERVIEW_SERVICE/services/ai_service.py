import os
import json
import asyncio
from openai import AsyncOpenAI, InternalServerError, RateLimitError, APIError
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client pointing to Gemini's OpenAI-compatible endpoint
client = AsyncOpenAI(
    api_key=os.environ.get("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

# Both models are listed as available for generation by this Gemini API key.
MODELS = ["gemini-3.8-flash", "gemini-3.7-flash"]

async def execute_chat_completion_with_fallback(prompt: str, max_retries: int = 3):
    """
    Executes chat completion with exponential backoff retries and model fallback
    to absorb temporary 503/429 server spikes on the free tier.
    """
    last_exception = None

    for model_name in MODELS:
        for attempt in range(max_retries):
            try:
                response = await client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                return response.choices[0].message.content
            except RateLimitError as err:
                last_exception = err
                error_text = str(err).lower()
                if "quota exceeded" in error_text or "generate_requests_per_day" in error_text:
                    print(f"Daily quota exhausted for {model_name}; trying the next model.")
                    break
                wait_time = 2 ** attempt  # 1s, 2s, 4s
                print(f"Warning: {model_name} busy ({err.status_code}). Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            except InternalServerError as err:
                last_exception = err
                wait_time = 2 ** attempt  # 1s, 2s, 4s
                print(f"Warning: {model_name} busy ({err.status_code}). Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            except APIError as err:
                last_exception = err
                print(f"APIError on {model_name}: {err}. Trying fallback model...")
                break

    raise last_exception


async def generate_questions_intro(job_title: str, job_description: str, resume_text: str):
    prompt = f"""
    You are an AI interview expert, who generates questions based on candidate's job_title, job_description, and resume_text.
    You need to find out the candidate's name, generate an introduction text including the candidate's name, and generate questions
    based on job_description, job_title, candidate skills, and years of experience from resume_text.

    Input:
        job_title: {job_title}
        job_description: {job_description}
        resume_text: {resume_text}

    Output Structure (JSON):
        questions: array of string
        introText: string
        candidate_name: string

    Rules:
        - For Questions:
            a) Generate 2-3 questions.
            b) Consider years of experience to set the difficulty of interview questions.
            c) Questions should progress in an easy-to-hard manner.
            d) Questions must relate only to skills mentioned in resume, job_description, and job_title.
            e) Questions need to be concise, to the point, and occasionally scenario-based.
        - For Introduction Text:
            a) It is a simple spoken introduction played in browser before the interview starts.
            b) Include candidate name and job title.
            c) Add your own natural conversational greeting.
        - For Candidate Name:
            a) Extract candidate name from resume. If not found, use "Candidate".
        - Output:
            Return valid JSON with keys: questions, introText, candidate_name.
    """

    content = await execute_chat_completion_with_fallback(prompt)
    try:
        return json.loads(content)
    except (json.JSONDecodeError, TypeError):
        print("Failed to parse model response:", content)
        raise


async def generate_report(answers=None):
    if answers is None:
        answers = []

    prompt = f"""
    You are an expert AI interviewer who analyses the candidate's answers based on questions and provides feedback.
    You need to calculate Score in percentage, Total Correct Answers, and detailed areas of improvement (not more than 5 points).

    Input: {answers}

    Input Structure:
    answers is an array of objects:
        - question: string
        - answer: string | null (null if skipped)
        - skip: bool

    Output Structure (JSON):
        - score: string (e.g. "75%")
        - correct_answer: number
        - improvement_area: array of strings (maximum 5 items)

    Rules:
        - Do not be overly strict when evaluating answers.
        - Consider the answer correct if the candidate addressed at least 70% of the key concept.
        - If the candidate skipped or didn't answer anything, mark score as "0%", correct_answer as 0, and provide constructive improvement points.
        - Return strictly valid JSON.
    """

    content = await execute_chat_completion_with_fallback(prompt)
    try:
        return json.loads(content)
    except (json.JSONDecodeError, TypeError):
        print("Failed to parse model response:", content)
        raise