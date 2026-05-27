import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBVXMtwqKofge0x2iMECY5wv7Y3gL0kpZ4",
  authDomain: "storyverse-d4c86.firebaseapp.com",
  projectId: "storyverse-d4c86",
  storageBucket: "storyverse-d4c86.firebasestorage.app",
  messagingSenderId: "331288557238",
  appId: "1:331288557238:web:be9297c70e9b1f8dd3d817"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const storyForm = document.getElementById('story-form');
const storyAuthor = document.getElementById('story-author');
const storyTitle = document.getElementById('story-title');
const storyContent = document.getElementById('story-content');
const storiesContainer = document.getElementById('stories-container');
const colorDots = document.querySelectorAll('.color-dot');
const searchInput = document.getElementById('search-stories');

let stories = [];

// Load stories from Firestore
const loadStories = async () => {
    try {
        const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        stories = [];
        querySnapshot.forEach((doc) => {
            stories.push({
                id: doc.id,
                ...doc.data()
            });
        });
        displayStories();
    } catch (error) {
        console.error('Error loading stories:', error);
        showToast('Error loading stories');
    }
};

// Initialize Theme
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

// Theme Toggle
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

// Color Picker
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

// Calculate Reading Time
const calculateReadingTime = (text) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.ceil(words / 200);
    return minutes === 0 ? '1 min read' : `${minutes} min read`;
};

// Format Date
const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
};

// Display Stories
const displayStories = (filterKeyword = "") => {
    try {
        storiesContainer.innerHTML = '';
        const query_str = filterKeyword.toLowerCase().trim();
        const filtered = stories.filter(s => 
            s.title.toLowerCase().includes(query_str) || 
            s.author.toLowerCase().includes(query_str)
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
                    </div>
                </div>`;
            storiesContainer.appendChild(card);
        });

        // Add event listeners
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => handleStoryAction(e));
        });
    } catch (error) {
        console.error('Error displaying stories:', error);
        showToast('Error displaying stories');
    }
};

// Handle Story Actions
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
    }
};

// Search
if(searchInput) {
    searchInput.addEventListener('input', (e) => displayStories(e.target.value));
}

// Submit Form
storyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const author = storyAuthor.value.trim();
        const title = storyTitle.value.trim();
        const content = storyContent.value.trim();
        
        if (!author || !title || !content) {
            showToast('Please fill in all fields');
            return;
        }
        
        const rTime = calculateReadingTime(content);

        await addDoc(collection(db, 'stories'), {
            author: author,
            title: title,
            content: content,
            likes: 0,
            isLiked: false,
            readTime: rTime,
            date: formatDate(),
            createdAt: serverTimestamp()
        });

        showToast("Story published live!");
        storyForm.reset();
        await loadStories();
    } catch (error) {
        console.error('Error submitting story:', error);
        showToast('Error saving story');
    }
});

// Share Story
const shareStory = (id) => {
    try {
        const s = stories.find(x => x.id === id);
        if (!s) {
            showToast('Story not found');
            return;
        }
        const shareText = `"${s.title}" by ${s.author}\n\n${s.content}`;
        
        if (navigator.share) {
            navigator.share({
                title: s.title,
                text: shareText
            }).catch(err => console.log('Share API error:', err));
        } else {
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

// Show Toast
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

// Toggle Like
const toggleLike = async (id) => {
    try {
        const story = stories.find(s => s.id === id);
        if (!story) return;

        const storyRef = doc(db, 'stories', id);
        await updateDoc(storyRef, {
            isLiked: !story.isLiked,
            likes: !story.isLiked ? (story.likes + 1) : (story.likes - 1)
        });

        await loadStories();
    } catch (error) {
        console.error('Error toggling like:', error);
        showToast('Error updating like');
    }
};

// Escape HTML
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

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initThemeEngine();
    loadStories();
});
