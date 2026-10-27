from typing import Optional

from pydantic import BaseModel

class GenerateQuestionResponse(BaseModel):
    session_id: str

class AnswerResponse(BaseModel):
    interviewEnded: bool
    nextQuestion:Optional[str]=None
    