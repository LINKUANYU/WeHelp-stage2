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
  memberEmail.value = email;
  memberName.value = name;
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