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
