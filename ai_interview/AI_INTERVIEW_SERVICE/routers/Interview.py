from fastapi import Form, UploadFile, status

from fastapi import APIRouter, HTTPException
from fastapi.params import File

from models.interview import InterviewStatusEnum
from request_model.AnswerRequest import AnswerRequest
from response_model.AnswerResponse import AnswerResponse, GenerateQuestionResponse
from services.ai_service import generate_questions_intro, generate_report
from services.interview_service import create_session, get_session, save_answer
from util.file_util import extract_text, validate_file


router=APIRouter(
    prefix="/interview",
    tags=["Interview"]
)

@router.post("/generate-questions", response_model=GenerateQuestionResponse)
async def generate_questions(
    job_title:str=Form(...),
    job_description:str=Form(...),
    resume : UploadFile=File(...),
):
    await validate_file(resume)
    
    resume_text = await extract_text(resume)
    
    resp= await generate_questions_intro(job_title,job_description,resume_text)
    
    session=create_session()
    session.questions=resp.get("questions",[])
    session.intro_text=resp.get("introText","")
    
    print("Result>>",resp)
    
    return {"session_id":session.session_id }
    

@router.get("/start/{session_id}")
async def start_interview(session_id: str):    
    
    session=get_session(session_id)
    if not session or session.status==InterviewStatusEnum.COMPLETED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Interview session not valid")
    
    
    return {
        "introText":session.intro_text,
        "firstQuestion":session.questions[0]
    }
    
  
@router.post("/submit", response_model=AnswerResponse)
async def submit_answer(answerReq: AnswerRequest):
    #checking session
    session=get_session(answerReq.session_id)
    if not session or session.status==InterviewStatusEnum.COMPLETED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Interview session not valid")
    
    save_answer(answerReq.answer,answerReq.skip,session)
    
    if session.status==InterviewStatusEnum.COMPLETED:
        return{
            "interviewEnded":True
        }
    else:
        return {
            "interviewEnded":False,
            "nextQuestion":session.questions[session.current_index]
        }
        
@router.post("/end/{session_id}", response_model=AnswerResponse)
async def end_interview(session_id:str):
    session=get_session(session_id)
    if not session or session.status==InterviewStatusEnum.COMPLETED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Interview session not valid")
    
    session.status=InterviewStatusEnum.COMPLETED    
    return{
        "interviewEnded":True
    }
    
@router.get("/report/{session_id}")
async def get_report(session_id:str):
    session=get_session(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Interview session not valid")
    
    try:
        resp = await generate_report(session.answers)
    except Exception as error:
        print("Report generation failed:", error)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Report generation failed. Check the AI provider configuration and server logs.",
        ) from error

    print("Report>>", resp)
    return {
        "result" : resp
    }