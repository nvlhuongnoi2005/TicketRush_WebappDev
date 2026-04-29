import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from core.deps import get_current_user
from core.security import hash_password, verify_password, create_access_token
from models.user import User, UserRole
from schemas.user import UserRegister, UserLogin, UserUpdate, UserOut, TokenOut, ForgotPasswordRequest, ResetPasswordRequest

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username đã tồn tại")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    user = User(
        full_name=body.full_name,
        email=body.email,
        phone=body.phone,
        dob=body.dob,
        gender=body.gender,
        username=body.username,
        hashed_password=hash_password(body.password),
        role=UserRole.customer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=TokenOut)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản hoặc mật khẩu không đúng!",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Không có email service → trả reset_token thẳng về response.
    Frontend hiển thị token để user copy và điền vào form reset.
    """
    user = db.query(User).filter(
        User.username == body.username,
        User.email == body.email,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản với username và email này")

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=30)
    db.commit()
    return {
        "message": "Đã tạo mã đặt lại mật khẩu. Dùng mã này để đặt lại mật khẩu.",
        "reset_token": token,
        "expires_in_minutes": 30,
    }


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == body.reset_token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Mã đặt lại không hợp lệ")
    if user.reset_token_expires_at and datetime.utcnow() > user.reset_token_expires_at:
        raise HTTPException(status_code=400, detail="Mã đặt lại đã hết hạn")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 8 ký tự")

    user.hashed_password = hash_password(body.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()
    return {"message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."}
