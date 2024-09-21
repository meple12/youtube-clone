let currentUser = localStorage.getItem('currentUser');
let videos = [];
let comments = {};

const content = document.getElementById('content');
const homeLink = document.getElementById('homeLink');
const uploadLink = document.getElementById('uploadLink');
const loginLink = document.getElementById('loginLink');
const userInfo = document.getElementById('userInfo');

homeLink.addEventListener('click', loadHomePage);
uploadLink.addEventListener('click', showUploadForm);
loginLink.addEventListener('click', toggleLoginStatus);

loadHomePage();

async function loadHomePage() {
    await fetchVideos();
    await fetchComments();
    displayVideos();
}

async function fetchVideos() {
    try {
        // GitHub API를 통해 비디오 데이터를 가져옵니다.
        const response = await fetch('https://api.github.com/repos/your-username/your-repo/contents/data/videos.json');
        const data = await response.json();
        videos = JSON.parse(atob(data.content));
    } catch (error) {
        console.error('비디오 가져오기 오류:', error);
        content.innerHTML = '<p>비디오를 가져오는 데 실패했습니다.</p>';
    }
}

async function fetchComments() {
    try {
        // GitHub API를 통해 댓글 데이터를 가져옵니다.
        const response = await fetch('https://api.github.com/repos/your-username/your-repo/contents/data/comments.json');
        const data = await response.json();
        comments = JSON.parse(atob(data.content));
    } catch (error) {
        console.error('댓글 가져오기 오류:', error);
        content.innerHTML += '<p>댓글을 가져오는 데 실패했습니다.</p>';
    }
}

function displayVideos() {
    let html = '<h2>최신 동영상</h2>';
    videos.forEach(video => {
        html += `
            <div class="video">
                <h3>${video.title}</h3>
                <video src="${video.url}" controls></video>
                <div class="comments">
                    ${displayComments(video.id)}
                    ${currentUser ? `<input type="text" id="comment-${video.id}" placeholder="댓글 추가">
                    <button onclick="addComment(${video.id})">게시</button>` : ''}
                </div>
            </div>
        `;
    });
    content.innerHTML = html;
}

function displayComments(videoId) {
    if (!comments[videoId]) return '';
    return comments[videoId].map(comment => `
        <div class="comment">${comment.content} - ${comment.author}</div>
    `).join('');
}

async function addComment(videoId) {
    const commentInput = document.getElementById(`comment-${videoId}`);
    const commentContent = commentInput.value.trim();
    
    if (commentContent && currentUser) {
        const newComment = { author: currentUser, content: commentContent };
        comments[videoId] = comments[videoId] || [];
        comments[videoId].push(newComment);
        
        // GitHub API를 통해 댓글 데이터를 업데이트합니다.
        try {
            const response = await fetch(`https://api.github.com/repos/your-username/your-repo/contents/data/comments.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token YOUR_GITHUB_TOKEN`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Add comment',
                    content: btoa(JSON.stringify(comments)),
                    sha: await getFileSha('data/comments.json')
                })
            });
            if (response.ok) {
                commentInput.value = '';
                displayVideos();
            }
        } catch (error) {
            console.error('댓글 추가 오류:', error);
        }
        
        commentInput.value = '';
        displayVideos();
        
     }
}

async function getFileSha(filename) {
   // 파일의 SHA 값을 가져오는 함수입니다.
   try {
       const response = await fetch(`https://api.github.com/repos/your-username/your-repo/contents/${filename}`);
       const data = await response.json();
       return data.sha;
   } catch (error) {
       console.error('SHA 가져오기 오류:', error);
   }
}

function showUploadForm() {
   if (!currentUser) {
       alert('동영상을 업로드하려면 로그인이 필요합니다.');
       return;
   }
   content.innerHTML = `
       <h2>동영상 업로드</h2>
       <form id="uploadForm">
           <input type="text" id="videoTitle" placeholder="동영상 제목" required>
           <input type="text" id="videoUrl" placeholder="동영상 URL" required>
           <button type="submit">업로드</button>
       </form>
   `;
   document.getElementById('uploadForm').addEventListener('submit', handleUpload);
}

async function handleUpload(e) {
   e.preventDefault();
   const title = document.getElementById('videoTitle').value.trim();
   const url = document.getElementById('videoUrl').value.trim();

   if (title && url) {
       const newVideo = { id: Date.now(), title, url };
       videos.push(newVideo);

       // GitHub API를 통해 비디오 데이터를 업데이트합니다.
       try {
           const response = await fetch(`https://api.github.com/repos/your-username/your-repo/contents/data/videos.json`, {
               method: 'PUT',
               headers: {
                   'Authorization': `token YOUR_GITHUB_TOKEN`,
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                   message: 'Add video',
                   content: btoa(JSON.stringify(videos)),
                   sha: await getFileSha('data/videos.json')
               })
           });
           if (response.ok) loadHomePage();
       } catch (error) {
           console.error('비디오 업로드 오류:', error);
       }
   }
}

function toggleLoginStatus() {
   if (currentUser) {
       currentUser = null;
       localStorage.removeItem('currentUser');
       loginLink.textContent = '로그인';
       userInfo.textContent = '';
   } else {
       currentUser = prompt('사용자 이름을 입력하세요.');
       if (currentUser) {
           localStorage.setItem('currentUser', currentUser);
           loginLink.textContent = '로그아웃';
           userInfo.textContent = `${currentUser}님 환영합니다`;
       }
   }
   loadHomePage();
}
// 사용자 데이터를 저장할 객체
let users = JSON.parse(localStorage.getItem('users')) || {};

// 현재 로그인한 사용자
let currentUser = localStorage.getItem('currentUser');

// DOM 요소
const loginLink = document.getElementById('loginLink');
const userInfo = document.getElementById('userInfo');

// 이벤트 리스너
loginLink.addEventListener('click', toggleLoginStatus);

// 페이지 로드 시 사용자 상태 업데이트
updateUserStatus();

// 로그인 상태 토글 함수
function toggleLoginStatus() {
    if (currentUser) {
        logout();
    } else {
        showLoginForm();
    }
}

// 로그인 폼 표시
function showLoginForm() {
    content.innerHTML = `
        <h2>로그인</h2>
        <form id="loginForm">
            <input type="text" id="username" placeholder="사용자 이름" required>
            <input type="password" id="password" placeholder="비밀번호" required>
            <button type="submit">로그인</button>
        </form>
        <p>계정이 없으신가요? <a href="#" id="showRegister">회원가입</a></p>
    `;
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
}

// 회원가입 폼 표시
function showRegisterForm() {
    content.innerHTML = `
        <h2>회원가입</h2>
        <form id="registerForm">
            <input type="text" id="newUsername" placeholder="사용자 이름" required>
            <input type="password" id="newPassword" placeholder="비밀번호" required>
            <button type="submit">가입하기</button>
        </form>
        <p>이미 계정이 있으신가요? <a href="#" id="showLogin">로그인</a></p>
    `;
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
}

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (users[username] && users[username].password === password) {
        currentUser = username;
        localStorage.setItem('currentUser', currentUser);
        updateUserStatus();
        loadHomePage();
    } else {
        alert('사용자 이름 또는 비밀번호가 올바르지 않습니다.');
    }
}

// 회원가입 처리
function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;

    if (users[username]) {
        alert('이미 존재하는 사용자 이름입니다.');
    } else {
        users[username] = { password: password };
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = username;
        localStorage.setItem('currentUser', currentUser);
        updateUserStatus();
        loadHomePage();
    }
}

// 로그아웃 처리
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserStatus();
    loadHomePage();
}

// 사용자 상태 업데이트
function updateUserStatus() {
    if (currentUser) {
        loginLink.textContent = '로그아웃';
        userInfo.textContent = `${currentUser}님 환영합니다`;
    } else {
        loginLink.textContent = '로그인';
        userInfo.textContent = '';
    }
}

// 기존 loadHomePage 함수 수정
function loadHomePage() {
    fetchVideos().then(() => {
        fetchComments().then(() => {
            displayVideos();
        });
    });
}

// 비디오 표시 함수 수정 (로그인 상태에 따라 댓글 입력 폼 표시)
function displayVideos() {
    let html = '<h2>최신 동영상</h2>';
    videos.forEach(video => {
        html += `
            <div class="video">
                <h3>${video.title}</h3>
                <video src="${video.url}" controls></video>
                <div class="comments">
                    ${displayComments(video.id)}
                    ${currentUser ? `
                        <input type="text" id="comment-${video.id}" placeholder="댓글 추가">
                        <button onclick="addComment(${video.id})">게시</button>
                    ` : '<p>댓글을 작성하려면 로그인하세요.</p>'}
                </div>
            </div>
        `;
    });
    content.innerHTML = html;
}
