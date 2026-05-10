const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const postBtn = document.getElementById('postBtn');
const postList = document.getElementById('postList');

postBtn.addEventListener('click', function() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    alert('请输入番剧名称和评价！');
    return;
  }

  const postItem = document.createElement('div');
  postItem.className = 'post-item';
  postItem.innerHTML = `
    <h3>${title}</h3>
    <p>${content}</p>
  `;

  postList.prepend(postItem);

  titleInput.value = '';
  contentInput.value = '';

  alert('番剧分享成功！');
});