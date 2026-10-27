import io

import PyPDF2
from fastapi import status,HTTPException

from fastapi import UploadFile

MAX_FILE_SIZE_MB = 5* 1024 * 1024  # Maximum file size in megabytes
async def validate_file(resume: UploadFile):
    # Check FILE SIZE
    resume.file.seek(0,2)
    size = resume.file.tell()
    await resume.seek(0)
    if size > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds the limit of 5MB.")
    
    #check file type
    file_format = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if resume.content_type not in file_format:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Only PDF, DOC, and DOCX files are allowed.")


async def extract_text(resume: UploadFile):
    # Placeholder for text extraction logic
    # You can implement the actual text extraction logic here using libraries like PyPDF2, python-docx, etc.
    content = await resume.read()
    
    if resume.content_type == "application/pdf":
        reader=PyPDF2.PdfReader(io.BytesIO(content))
        return " ".join(page.extract_text() or "" for page in reader.pages)
    
    return ""