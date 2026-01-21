from fastapi import *
from deps import get_conn, get_cur
from mysql.connector import Error
from auth import verify_token

router = APIRouter()

