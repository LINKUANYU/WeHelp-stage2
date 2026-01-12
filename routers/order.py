



from fastapi import *
from deps import get_conn, get_cur
from routers.auth import verify_token
from mysql.connector import Error, IntegrityError, DataError
import json

router = APIRouter()