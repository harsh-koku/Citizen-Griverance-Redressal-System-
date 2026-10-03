from pydantic import BaseModel, EmailStr

#Schema for registration
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

    
#Schema for Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    

#Schema for Token Response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"