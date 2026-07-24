const REPO_OWNER = 'shorya95';
const REPO_NAME = 'shoryarastogi.com';
const FILE_PATH = 'portfolio.json';

let githubToken = localStorage.getItem('ghToken') || '';
let currentPortfolio = [];
let fileSha = '';

// DOM Elements
const loader = document.getElementById('loader');
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const editorSection = document.getElementById('editor-section');
const userControls = document.getElementById('user-controls');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const ghTokenInput = document.getElementById('ghToken');
const loginError = document.getElementById('loginError');
const projectList = document.getElementById('projectList');
const addNewBtn = document.getElementById('addNewBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveBtn = document.getElementById('saveBtn');
const addLinkBtn = document.getElementById('addLinkBtn');
const linksContainer = document.getElementById('linksContainer');

// Init
if (githubToken) {
  showLoader();
  fetchPortfolio().then(success => {
    if (success) {
      showDashboard();
    } else {
      logout();
    }
    hideLoader();
  });
} else {
  showLogin();
}

// ── NAVIGATION & UI ──────────────────────────────────────
function showLogin() {
  loginSection.style.display = 'block';
  dashboardSection.style.display = 'none';
  editorSection.style.display = 'none';
  userControls.style.display = 'none';
}

function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  editorSection.style.display = 'none';
  userControls.style.display = 'block';
  renderDashboard();
}

function showEditor() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'none';
  editorSection.style.display = 'block';
}

function showLoader() { loader.style.display = 'block'; }
function hideLoader() { loader.style.display = 'none'; }

// ── GITHUB API ───────────────────────────────────────────
async function fetchPortfolio() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      cache: 'no-store' // prevent caching issues during editing
    });
    
    if (!res.ok) throw new Error('Invalid token or repository access');
    
    const data = await res.json();
    fileSha = data.sha;
    
    // Decode base64 utf-8
    const contentStr = decodeURIComponent(escape(atob(data.content)));
    currentPortfolio = JSON.parse(contentStr);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function saveToGitHub(newContentJson) {
  try {
    const contentStr = unescape(encodeURIComponent(JSON.stringify(newContentJson, null, 2)));
    const contentBase64 = btoa(contentStr);
    
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update portfolio via Admin Dashboard',
        content: contentBase64,
        sha: fileSha
      })
    });
    
    if (!res.ok) throw new Error('Failed to save to GitHub');
    
    const data = await res.json();
    fileSha = data.content.sha; // update SHA for next commit
    return true;
  } catch (err) {
    console.error(err);
    alert('Error saving to GitHub. Please check console.');
    return false;
  }
}

async function uploadImageToGitHub(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result.split(',')[1];
        const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const timestamp = new Date().getTime();
        const filePath = `assets/portfolio/${timestamp}_${cleanName}`;
        
        const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Upload image: ${filePath}`,
            content: base64Data
          })
        });
        
        if (!res.ok) throw new Error('Failed to upload image');
        resolve(filePath);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

// ── EVENT LISTENERS ──────────────────────────────────────
loginBtn.addEventListener('click', async () => {
  const token = ghTokenInput.value.trim();
  if (!token) return;
  
  githubToken = token;
  showLoader();
  const success = await fetchPortfolio();
  hideLoader();
  
  if (success) {
    localStorage.setItem('ghToken', githubToken);
    loginError.style.display = 'none';
    showDashboard();
  } else {
    githubToken = '';
    loginError.textContent = 'Invalid token or unable to access repository.';
    loginError.style.display = 'block';
  }
});

function logout() {
  githubToken = '';
  localStorage.removeItem('ghToken');
  showLogin();
}
logoutBtn.addEventListener('click', logout);

addNewBtn.addEventListener('click', () => {
  openEditor(null); // null means new project
});

cancelEditBtn.addEventListener('click', () => {
  showDashboard();
});

saveBtn.addEventListener('click', async () => {
  showLoader();
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  const fileInput = document.getElementById('editImageUpload');
  const file = fileInput.files[0];
  
  if (file) {
    try {
      saveBtn.textContent = 'Uploading Image...';
      const uploadedPath = await uploadImageToGitHub(file);
      document.getElementById('editImageUrl').value = uploadedPath;
    } catch (err) {
      console.error(err);
      alert('Failed to upload image to GitHub.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save to GitHub';
      hideLoader();
      return;
    }
  }
  
  saveBtn.textContent = 'Saving Data...';
  
  const updatedItem = getEditorData();
  const isNew = !document.getElementById('editId').value;
  
  let newPortfolio = [...currentPortfolio];
  if (isNew) {
    updatedItem.id = updatedItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    newPortfolio.push(updatedItem);
  } else {
    const idx = newPortfolio.findIndex(p => p.id === updatedItem.id);
    if (idx !== -1) {
      newPortfolio[idx] = updatedItem;
    }
  }
  
  const success = await saveToGitHub(newPortfolio);
  
  if (success) {
    currentPortfolio = newPortfolio;
    showDashboard();
  }
  
  saveBtn.disabled = false;
  saveBtn.textContent = 'Save to GitHub';
  hideLoader();
});

// ── RENDER DASHBOARD ─────────────────────────────────────
function renderDashboard() {
  projectList.innerHTML = '';
  currentPortfolio.forEach(item => {
    const el = document.createElement('div');
    el.className = 'admin-project-card';
    el.innerHTML = `
      <div class="apc-info">
        <div class="apc-title">${item.name} ${item.isFeatured ? '<i class="fa-solid fa-star" style="color:var(--violet); font-size:12px;"></i>' : ''}</div>
        <div class="apc-category">${item.category} &bull; ${item.tag}</div>
      </div>
      <div class="apc-actions">
        <button class="btn btn-outline btn-sm edit-btn" data-id="${item.id}">Edit</button>
        <button class="btn btn-outline btn-sm del-btn" data-id="${item.id}" style="color:#ff6b6b; border-color:rgba(255,107,107,0.3);">Delete</button>
      </div>
    `;
    projectList.appendChild(el);
  });
  
  // Attach events
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const item = currentPortfolio.find(p => p.id === id);
      openEditor(item);
    });
  });
  
  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if(confirm('Are you sure you want to delete this project?')) {
        const id = e.target.dataset.id;
        showLoader();
        let newPortfolio = currentPortfolio.filter(p => p.id !== id);
        const success = await saveToGitHub(newPortfolio);
        if (success) {
          currentPortfolio = newPortfolio;
          renderDashboard();
        }
        hideLoader();
      }
    });
  });
}

// ── EDITOR LOGIC ─────────────────────────────────────────
function openEditor(item) {
  linksContainer.innerHTML = ''; // clear links
  document.getElementById('editImageUpload').value = '';
  
  if (item) {
    document.getElementById('editorTitle').textContent = 'Edit Project';
    document.getElementById('editId').value = item.id;
    document.getElementById('editName').value = item.name;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editImageUrl').value = item.imageUrl || '';
    document.getElementById('editImage').value = item.imagePlaceholder || '';
    document.getElementById('editTag').value = item.tag;
    document.getElementById('editFeatured').checked = item.isFeatured;
    document.getElementById('editDesc').value = item.description;
    
    item.links.forEach(l => addLinkRow(l.url, l.text, l.isSecondary));
  } else {
    document.getElementById('editorTitle').textContent = 'Add New Project';
    document.getElementById('editId').value = '';
    document.getElementById('editName').value = '';
    document.getElementById('editCategory').value = 'saas';
    document.getElementById('editImageUrl').value = '';
    document.getElementById('editImage').value = '';
    document.getElementById('editTag').value = '';
    document.getElementById('editFeatured').checked = false;
    document.getElementById('editDesc').value = '';
  }
  
  showEditor();
}

addLinkBtn.addEventListener('click', () => addLinkRow());

function addLinkRow(url = '', text = '', isSecondary = false) {
  const row = document.createElement('div');
  row.className = 'link-row';
  row.innerHTML = `
    <div class="form-group">
      <input type="text" class="form-input link-text" placeholder="Link Text (e.g. View App ↗)" value="${text}" />
    </div>
    <div class="form-group">
      <input type="url" class="form-input link-url" placeholder="URL (https://...)" value="${url}" />
    </div>
    <div class="form-group checkbox">
      <input type="checkbox" class="link-sec" ${isSecondary ? 'checked' : ''} /> Secondary
    </div>
    <button class="btn btn-outline btn-sm remove-link-btn" style="margin-bottom: 2px;"><i class="fa-solid fa-trash"></i></button>
  `;
  linksContainer.appendChild(row);
  
  row.querySelector('.remove-link-btn').addEventListener('click', () => {
    row.remove();
  });
}

function getEditorData() {
  const links = [];
  document.querySelectorAll('.link-row').forEach(row => {
    const text = row.querySelector('.link-text').value.trim();
    const url = row.querySelector('.link-url').value.trim();
    const isSec = row.querySelector('.link-sec').checked;
    if (text || url) {
      links.push({ url, text, isSecondary: isSec });
    }
  });
  
  return {
    id: document.getElementById('editId').value,
    name: document.getElementById('editName').value.trim(),
    category: document.getElementById('editCategory').value,
    imageUrl: document.getElementById('editImageUrl').value.trim(),
    imagePlaceholder: document.getElementById('editImage').value.trim(),
    tag: document.getElementById('editTag').value.trim(),
    isFeatured: document.getElementById('editFeatured').checked,
    description: document.getElementById('editDesc').value.trim(),
    links: links
  };
}
