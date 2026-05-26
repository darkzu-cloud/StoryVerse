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

let stories = [];

// Initialize stories from localStorage with error handling
const initializeStories = () => {
    try {
        stories = JSON.parse(localStorage.getItem('stories_v6')) || [];
    } catch (error) {
        console.error('Error loading stories from localStorage:', error);
        stories = [];
        showToast('Error loading stories. Starting fresh.');
    }
};

const initThemeEngine = () => {
    try {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const savedAccent = localStorage.getItem('accent_theme') || 'purple';
        document.documentElement.setAttribute('data-accent', savedAccent);
        colorDots.forEach(dot => dot.classList.toggle('active', dot.dataset.color === savedAccent));
    } catch (error) {
        console.error('Error initializing theme:', error);
    }
};

themeToggle.addEventListener('click', () => {
    try {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    } catch (error) {
        console.error('Error toggling theme:', error);
    }
});

colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        try {
            const selectColor = dot.dataset.color;
            document.documentElement.setAttribute('data-accent', selectColor);
            localStorage.setItem('accent_theme', selectColor);
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        } catch (error) {
            console.error('Error changing accent color:', error);
        }
    });
});

const calculateReadingTime = (text) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.ceil(words / 200);
    return minutes === 0 ? '1 min read' : `${minutes} min read`;
};

const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
};

const displayStories = (filterKeyword = "") => {
    try {
        storiesContainer.innerHTML = '';
        const query = filterKeyword.toLowerCase().trim();
        const filtered = stories.filter(s => 
            s.title.toLowerCase().includes(query) || 
            s.author.toLowerCase().includes(query)
        );

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
                        <div class="story-title-area">
                            <h3>${escapeHTML(story.title)}</h3>
                        </div>
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
                            <button class="action-btn like-btn ${story.isLiked ? 'liked' : ''}" data-action="like" data-id="${story.id}" aria-label="Like story">
                                <i class="${story.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i> <span>${story.likes || 0}</span>
                            </button>
                            <button class="action-btn share-btn" data-action="share" data-id="${story.id}" aria-label="Share story">
                                <i class="fa-regular fa-share-from-square"></i> <span>Share</span>
                            </button>
                        </div>
                        <div class="management-btns">
                            <button class="action-btn edit-btn" data-action="edit" data-id="${story.id}" aria-label="Edit story"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="action-btn delete-btn" data-action="delete" data-id="${story.id}" aria-label="Delete story"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                </div>`;
            storiesContainer.appendChild(card);
        });

        // Add event listeners to all action buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => handleStoryAction(e));
        });
    } catch (error) {
        console.error('Error displaying stories:', error);
        showToast('Error displaying stories');
    }
};

const handleStoryAction = (e) => {
    const action = e.currentTarget.dataset.action;
    const id = e.currentTarget.dataset.id;
    
    switch(action) {
        case 'like':
            toggleLike(id);
            break;
        case 'share':
            shareStory(id);
            break;
        case 'edit':
            startEditStory(id);
            break;
        case 'delete':
            deleteStory(id, e);
            break;
    }
};

if(searchInput) {
    searchInput.addEventListener('input', (e) => displayStories(e.target.value));
}

storyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    try {
        // Validate inputs
        const author = storyAuthor.value.trim();
        const title = storyTitle.value.trim();
        const content = storyContent.value.trim();
        
        if (!author || !title || !content) {
            showToast('Please fill in all fields');
            return;
        }
        
        const id = editStoryId.value;
        const rTime = calculateReadingTime(content);

        if (id) {
            stories = stories.map(s => 
                s.id === id ? { 
                    ...s, 
                    author: author, 
                    title: title, 
                    content: content, 
                    readTime: rTime 
                } : s
            );
            showToast("Story updated successfully!");
            resetFormState();
        } else {
            stories.unshift({ 
                id: Date.now().toString(), 
                author: author, 
                title: title, 
                content: content, 
                likes: 0, 
                isLiked: false, 
                readTime: rTime, 
                date: formatDate()
            });
            showToast("Story published live!");
        }
        saveAndRefresh();
        storyForm.reset();
    } catch (error) {
        console.error('Error submitting story:', error);
        showToast('Error saving story');
    }
});

const startEditStory = (id) => {
    try {
        const s = stories.find(x => x.id === id);
        if (!s) {
            showToast('Story not found');
            return;
        }
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
    } catch (error) {
        console.error('Error starting edit:', error);
        showToast('Error editing story');
    }
};

cancelEditBtn.addEventListener('click', () => { 
    storyForm.reset(); 
    resetFormState(); 
});

const resetFormState = () => { 
    try {
        editStoryId.value = ""; 
        formTitle.textContent = "Create a Story"; 
        submitBtnText.textContent = "Publish Story"; 
        submitBtnIcon.className = "fa-solid fa-paper-plane"; 
        cancelEditBtn.classList.add('hidden');
    } catch (error) {
        console.error('Error resetting form:', error);
    }
};

const shareStory = (id) => {
    try {
        const s = stories.find(x => x.id === id);
        if (!s) {
            showToast('Story not found');
            return;
        }
        const shareText = `"${s.title}" by ${s.author}\n\n${s.content}`;
        
        // Check if Web Share API is available
        if (navigator.share) {
            navigator.share({
                title: s.title,
                text: shareText
            }).catch(err => console.log('Share API error:', err));
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                showToast("Story copied to clipboard!");
            }).catch(err => {
                console.error('Clipboard error:', err);
                showToast("Error copying to clipboard");
            });
        }
    } catch (error) {
        console.error('Error sharing story:', error);
        showToast('Error sharing story');
    }
};

const showToast = (msg) => {
    try {
        const old = document.querySelector('.toast-notification'); 
        if (old) old.remove();
        const t = document.createElement('div'); 
        t.className = 'toast-notification';
        t.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${escapeHTML(msg)}</span>`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    } catch (error) {
        console.error('Error showing toast:', error);
    }
};

const toggleLike = (id) => {
    try {
        stories = stories.map(s => 
            s.id === id ? { 
                ...s, 
                isLiked: !s.isLiked, 
                likes: !s.isLiked ? (s.likes + 1) : (s.likes - 1) 
            } : s
        ); 
        saveAndRefresh();
    } catch (error) {
        console.error('Error toggling like:', error);
        showToast('Error updating like');
    }
};

const deleteStory = (id, e) => {
    try {
        if (confirm("Permanently delete this story?")) { 
            stories = stories.filter(s => s.id !== id); 
            if (editStoryId.value === id) resetFormState(); 
            saveAndRefresh(); 
            showToast("Story deleted successfully!");
        }
    } catch (error) {
        console.error('Error deleting story:', error);
        showToast('Error deleting story');
    }
};

const saveAndRefresh = () => {
    try {
        localStorage.setItem('stories_v6', JSON.stringify(stories)); 
        displayStories(searchInput ? searchInput.value : "");
    } catch (error) {
        console.error('Error saving stories:', error);
        showToast('Error saving stories');
    }
};

const escapeHTML = (str) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeStories();
    initThemeEngine();
    displayStories();
});
