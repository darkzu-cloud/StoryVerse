const themeToggle = document.getElementById('theme-toggle');
const storyForm = document.getElementById('story-form');
const editStoryId = document.getElementById('edit-story-id');
const storyAuthor = document.getElementById('story-author');
const storyTitle = document.getElementById('story-title');
const storyContent = document.getElementById('story-content');
const storiesContainer = document.getElementById('stories-container');
const colorDots = document.querySelectorAll('.color-dot');
const formTitle = document.getElementById('form-title');
const submitBtnText = document.getElementById('submit-btn-text');
const submitBtnIcon = document.getElementById('submit-btn-icon');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const searchInput = document.getElementById('search-stories');

let stories = JSON.parse(localStorage.getItem('stories_v6')) || [];

const initThemeEngine = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const savedAccent = localStorage.getItem('accent_theme') || 'purple';
    document.documentElement.setAttribute('data-accent', savedAccent);
    colorDots.forEach(dot => dot.classList.toggle('active', dot.dataset.color === savedAccent));
};

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const selectColor = dot.dataset.color;
        document.documentElement.setAttribute('data-accent', selectColor);
        localStorage.setItem('accent_theme', selectColor);
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
    });
});

const calculateReadingTime = (text) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.ceil(words / 200);
    return minutes === 0 ? '1 min read' : `${minutes} min read`;
};
const displayStories = (filterKeyword = "") => {
    storiesContainer.innerHTML = '';
    const query = filterKeyword.toLowerCase().trim();
    const filtered = stories.filter(s => s.title.toLowerCase().includes(query) || s.author.toLowerCase().includes(query));

    if (filtered.length === 0) {
        storiesContainer.innerHTML = `
            <div class="story-card" style="text-align:center; padding:4rem 2rem; color:var(--text-muted);">
                <i class="fa-solid fa-magnifying-glass" style="font-size:2.5rem; margin-bottom:1rem; color:var(--accent); opacity:0.5;"></i>
                <p>No matching stories found.</p>
            </div>`;
        return;
    }

    filtered.forEach(story => {
        const card = document.createElement('article');
        card.className = 'story-card';
        card.innerHTML = `
            <div class="story-body">
                <div class="story-header">
                    <h3>${escapeHTML(story.title)}</h3>
                    <span class="story-date"><i class="fa-regular fa-calendar"></i> ${story.date}</span>
                </div>
                <div class="story-meta-row">
                    <small class="story-author-tag">By <span>${escapeHTML(story.author)}</span></small>
                    <span class="meta-divider"></span>
                    <span class="story-read-time"><i class="fa-regular fa-clock"></i> ${story.readTime || '1 min read'}</span>
                </div>
                <p>${escapeHTML(story.content)}</p>
                <div class="story-footer">
                    <div class="footer-left-actions">
                        <button class="action-btn like-btn ${story.isLiked ? 'liked' : ''}" onclick="toggleLike('${story.id}')">
                            <i class="${story.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i> <span>${story.likes || 0}</span>
                        </button>
                        <button class="action-btn share-btn" onclick="shareStory('${story.id}')">
                            <i class="fa-regular fa-share-from-square"></i> <span>Share</span>
                        </button>
                    </div>
                    <div class="management-btns">
                        <button class="action-btn edit-btn" onclick="startEditStory('${story.id}')" aria-label="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-btn delete-btn" onclick="deleteStory('${story.id}', event)" aria-label="Delete"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            </div>`;
        storiesContainer.appendChild(card);
    });
};

if(searchInput) {
    searchInput.addEventListener('input', (e) => displayStories(e.target.value));
}

storyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editStoryId.value;
    const txt = storyContent.value;
    const rTime = calculateReadingTime(txt);

    if (id) {
        stories = stories.map(s => s.id === id ? { ...s, author: storyAuthor.value.trim(), title: storyTitle.value.trim(), content: txt, readTime: rTime } : s);
        showToast("Story updated successfully!");
        resetFormState();
    } else {
        stories.unshift({ id: Date.now().toString(), author: storyAuthor.value.trim(), title: storyTitle.value.trim(), content: txt, likes: 0, isLiked: false, readTime: rTime, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) });
        showToast("Story published live!");
    }
    saveAndRefresh();
    storyForm.reset();
});

window.startEditStory = (id) => {
    const s = stories.find(x => x.id === id);
    if (!s) return;
    editStoryId.value = s.id;
    storyAuthor.value = s.author;
    storyTitle.value = s.title;
    storyContent.value = s.content;
    storyAuthor.dispatchEvent(new Event('input'));
    storyTitle.dispatchEvent(new Event('input'));
    storyContent.dispatchEvent(new Event('input'));

    formTitle.textContent = "Edit Your Story";
    submitBtnText.textContent = "Update Story";
    submitBtnIcon.className = "fa-solid fa-square-check";
    cancelEditBtn.classList.remove('hidden');
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
};

cancelEditBtn.addEventListener('click', () => { storyForm.reset(); resetFormState(); });
const resetFormState = () => { editStoryId.value = ""; formTitle.textContent = "Create a Story"; submitBtnText.textContent = "Publish Story"; submitBtnIcon.className = "fa-solid fa-paper-plane"; cancelEditBtn.classList.add('hidden'); };

window.shareStory = (id) => {
    const s = stories.find(x => x.id === id);
    if (!s) return;
    navigator.clipboard.writeText(`"${s.title}" by ${s.author}\n\n${s.content}`).then(() => showToast("Story copied to clipboard!"));
};

const showToast = (msg) => {
    const old = document.querySelector('.toast-notification'); if (old) old.remove();
    const t = document.createElement('div'); t.className = 'toast-notification';
    t.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
};

window.toggleLike = (id) => { stories = stories.map(s => s.id === id ? { ...s, isLiked: !s.isLiked, likes: !s.isLiked ? (s.likes + 1) : (s.likes - 1) } : s); saveAndRefresh(); };
window.deleteStory = (id, e) => { if (confirm("Permanently delete this story?")) { stories = stories.filter(s => s.id !== id); if (editStoryId.value === id) resetFormState(); saveAndRefresh(); showToast("Story deleted."); } };
const saveAndRefresh = () => { localStorage.setItem('stories_v6', JSON.stringify(stories)); displayStories(searchInput ? searchInput.value : ""); };
const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

initThemeEngine();
displayStories();
