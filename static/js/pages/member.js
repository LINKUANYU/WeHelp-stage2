// import function
import { authHeaders, getErrorMsg, request } from "../common/api.js";
import { setupAppShell } from "../components/setup_app_shell.js";
import { applySessionUi } from "../components/apply_session_ui.js";


async function startup(){
    // 1) 全站UI + 事件綁定
    setupAppShell();
    // 2) UI related with session + User info
    const {loggedIn, user} = await applySessionUi();
    // 3) 本頁
    // 沒登入的不能從url進來
    if (!loggedIn){
        window.location.href = "/";
        return
    }
    // 本頁渲染
    renderProfile(user);
    bindProfilePWInputValidation();
    bindProfileSubmitBtn();
    bindAvatarSelectBtn();
    bindAvatarSubmitBtn();

  }

startup();

function bindProfileSubmitBtn(){
  const profileSubmitBtn = document.querySelector('.profile__submit-btn');
  const profileSection = document.querySelector('.profile-section');
  profileSubmitBtn.addEventListener('click', async() => {
    const name = document.querySelector('#member-name').value;
    const oldPassword = document.querySelector('#old-password').value;
    const newPassword = document.querySelector('#new-password').value;

    if (name.length < 2){showErrMsg('姓名長度至少需 2 位'); return}
    if (oldPassword && !newPassword){showErrMsg('新密碼與舊密碼請輸入完整'); return}
    if (!oldPassword && newPassword){showErrMsg('新密碼與舊密碼請輸入完整'); return}
    if (oldPassword && newPassword){
      const invalidRules = profileSection.querySelectorAll('.invalid');
      if (invalidRules.length > 0){
        {showErrMsg('請確保密碼符合所有強度要求'); return}
      }
    }

    const body = {
      "name": name,
      "old_password": oldPassword,
      "new_password": newPassword
    }
    try{
      const res = await request("/api/user", {
        method: "PATCH",
        headers: authHeaders({"content-type": "application/json"}),
        body: JSON.stringify(body)
      });

      if (res.ok){
        const token = res.token;
        if (token) localStorage.setItem("access_token", token);
        alert("會員資料更新成功")
        window.location.reload();
      }
    }catch(e){
      showErrMsg(getErrorMsg(e));
    }
  });
}

function showErrMsg(msg){
  const profileSection = document.querySelector('.profile-section');
  const errmsg = profileSection.querySelector('.error-msg');
  errmsg.classList.remove('is-hidden');
  errmsg.textContent = msg;
}


function renderProfile(user){
  const email = user.email;
  const name = user.name;
  const memberEmail = document.querySelector('#member-email');
  const memberName = document.querySelector('#member-name');
  const avatarPreview = document.querySelector('#avatar-preview');
  memberEmail.value = email;
  memberName.value = name;

  if (!user.avatar_url){
    avatarPreview.src = "/static/icon/profile.png"
  }else{
    avatarPreview.src = user.avatar_url;
  }
  
}



function bindProfilePWInputValidation(){
  const newPasswordInput = document.querySelector('#new-password');
  const profileValidationList = document.querySelector('#profile-validation-list');
  const profileRuleLength = document.querySelector('#profile-rule-length');
  const profileRuleNumber = document.querySelector('#profile-rule-number');
  const profileRuleCapital = document.querySelector('#profile-rule-capital');
  const profileRuleSpecial = document.querySelector('#profile-rule-special');

  newPasswordInput.addEventListener('input', () => {
    const value = newPasswordInput.value.trim();
    
    if (value.length > 0){
      profileValidationList.classList.remove('is-hidden');
    }else{
      profileValidationList.classList.add('is-hidden');
    }
    updateStatus(profileRuleLength, (value.length >= 8));
    updateStatus(profileRuleNumber, /\d/.test(value));
    updateStatus(profileRuleCapital, /[A-Z]/.test(value));
    updateStatus(profileRuleSpecial, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value));
  });

}

function updateStatus(element, isValid){
  if (isValid){
    element.classList.replace('invalid', 'valid');
  }else{
    element.classList.replace('valid', 'invalid');
  }
}


function bindAvatarSelectBtn(){
  const selectAvatarBtn = document.querySelector('#select-avatar-btn');
  const avatarInput = document.querySelector('#avatar-input');
  // 點擊選擇按鈕就等於點擊input
  selectAvatarBtn.addEventListener('click', () => {
    avatarInput.click(); // 會去自己執行選檔案這件事
  });
  // 'change' 狀態改變 ＝ 已經選擇完檔案
  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file){
      if (file.size > 10 * 1024 * 1024){
        alert('照片檔案超過 10 MB');
        return
      }
      // 使用者電腦裡二進位檔案 -> 轉換成瀏覽器可以讀的（Base64 編碼）
      const reader = new FileReader(); // 這是在瀏覽器內開啟一個「讀卡機」。是讀取使用者電腦裡的二進位檔案，並將其轉換成網頁看得懂的格式。
      reader.onload = function(event) { // 讀取檔案需要一點時間，所以我們要設定一個「監聽器」：當讀取完成（load）時，再執行大頭貼預覽的動作。
        document.querySelector('#avatar-preview').src = event.target.result; // target.result 編碼完後可以直接放在 <img> 的 src 屬性裡顯示
      };
      reader.readAsDataURL(file); // 請把這個檔案讀取成一段長字串（Base64 編碼）
    }
  });
}


function bindAvatarSubmitBtn(){
  const saveAvatarBtn = document.querySelector('#save-avatar-btn');
  saveAvatarBtn.addEventListener('click', async() => {
    const avatarInput = document.querySelector('#avatar-input');
    const file = avatarInput.files[0];

    if (!file){alert('請先選擇一張照片'); return}
    
    const formData = new FormData(); // 上傳照片必須用 FormData
    formData.append('file', file);

    try{
      const res = await request("/api/user/avatar", {
        method: "PATCH",
        headers: authHeaders(),
        body: formData
      });

      if (res.ok){
        alert('大頭貼上傳成功！');
        window.location.reload();
      }
    }catch(e){
      console.log(getErrorMsg(e));
      alert(`上傳失敗，${getErrorMsg(e)}`);
    }

  });
}