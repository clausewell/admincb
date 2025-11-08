// Power Automate Flow URLs
const GET_STATUS_URL = 'https://default6bceeacf48244b408c6dfa6e15ddc6.d9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1301363e02e34cc791d4e75ea400b36d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iN2sh3VqqQDA4KVwtI6TpV0RXhk2_Y_9jSoIuXSMvWQ';
const UPDATE_STATUS_URL = 'https://default6bceeacf48244b408c6dfa6e15ddc6.d9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e51ca044361a45229ab5d339da70ace3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=IV76u1Y_6fq2vI3NHm7vlvyVpEpz0qpEQbdePTHO9EM';
const GET_CHATS_URL = 'https://default6bceeacf48244b408c6dfa6e15ddc6.d9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2334eb9a0d1d4d2386d56277e107c33a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2SGpKNNezwf-U1wiEpNYNU2CQI1ggzJB6k0nZO0YiFo';
const SEND_REPLY_URL = 'https://default6bceeacf48244b408c6dfa6e15ddc6.d9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9251f8b8ab2041a0906322115102a00a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=sBx5ObDZIS-KFZRJkpfdlv0nBAAO2Fx0eGTNsbX4ARI';

let currentStatus = null;
let currentChatId = null;
let chatsRefreshInterval = null;

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    checkStatus();
    loadChats();
    
    // Check URL for conversation ID (from email link)
    const urlParams = new URLSearchParams(window.location.search);
    const convId = urlParams.get('conv');
    if (convId) {
        // Give it a moment to load chats first
        setTimeout(() => openChatById(convId), 1000);
    }
    
    // Auto-refresh chats every 5 seconds
    chatsRefreshInterval = setInterval(loadChats, 5000);
});

// Status Toggle Functions
async function checkStatus() {
    try {
        const response = await fetch(GET_STATUS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkStatus: true })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch status');
        }
        
        const data = await response.json();
        currentStatus = data.isLive;
        
        updateStatusUI(data.isLive, data.lastUpdated);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('statusSection').style.display = 'block';
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load status.');
        document.getElementById('loading').style.display = 'none';
        document.getElementById('statusSection').style.display = 'block';
    }
}

function updateStatusUI(isLive, lastUpdated) {
    const card = document.getElementById('statusCard');
    const icon = document.getElementById('statusIcon');
    const text = document.getElementById('statusText');
    const description = document.getElementById('statusDescription');
    const updated = document.getElementById('lastUpdated');
    
    if (isLive) {
        card.className = 'status-card live';
        icon.textContent = '🟢';
        text.textContent = 'LIVE MODE';
        description.textContent = 'You are responding to chats';
    } else {
        card.className = 'status-card ai';
        icon.textContent = '🤖';
        text.textContent = 'AI MODE';
        description.textContent = 'AI assistant is handling chats';
    }
    
    const date = new Date(lastUpdated);
    const options = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: 'America/Los_Angeles',
        timeZoneName: 'short'
    };
    updated.textContent = `Last updated: ${date.toLocaleString('en-US', options)}`;
    
    document.getElementById('error').style.display = 'none';
}

async function toggleStatus() {
    const button = document.getElementById('toggleButton');
    button.disabled = true;
    button.textContent = 'Switching...';
    
    try {
        const newStatus = !currentStatus;
        
        const response = await fetch(UPDATE_STATUS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ setLive: newStatus })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
        
        await checkStatus();
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to switch mode.');
    } finally {
        button.disabled = false;
        button.textContent = 'Switch Mode';
    }
}

// Chat Functions
async function loadChats() {
    try {
        const response = await fetch(GET_CHATS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ getChats: true })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch chats');
        }
        
        const data = await response.json();
        displayChats(data.chats);
        
    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

function displayChats(chats) {
    const chatsList = document.getElementById('chatsList');
    
    if (!chats || chats.length === 0) {
        chatsList.innerHTML = '<p class="no-chats">No active chats</p>';
        return;
    }
    
    chatsList.innerHTML = chats.map(chat => `
        <div class="chat-item" onclick="openChat('${chat.conversationId}')">
            <div class="chat-item-info">
                <h4>${chat.firstName} ${chat.lastName}</h4>
                <p>${chat.email} • ${chat.phone}</p>
                <div class="chat-item-preview">"${truncate(chat.lastMessage, 60)}"</div>
            </div>
            ${chat.needsReply ? '<span class="chat-item-badge">New</span>' : ''}
        </div>
    `).join('');
}

function truncate(str, length) {
    return str.length > length ? str.substring(0, length) + '...' : str;
}

async function openChat(conversationId) {
    currentChatId = conversationId;
    
    // Hide chats list, show chat detail
    document.getElementById('chatsSection').style.display = 'none';
    document.getElementById('chatDetail').style.display = 'block';
    
    // Load chat messages
    await loadChatMessages(conversationId);
    
    // Stop auto-refreshing chats list while viewing a conversation
    clearInterval(chatsRefreshInterval);
    
    // Start auto-refreshing this conversation
    chatsRefreshInterval = setInterval(() => loadChatMessages(conversationId), 3000);
}

function openChatById(convId) {
    openChat(convId);
}

async function loadChatMessages(conversationId) {
    try {
        const response = await fetch(GET_CHATS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                conversationId: conversationId 
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        displayChatMessages(data);
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayChatMessages(data) {
    const { firstName, lastName, email, phone, messages } = data;
    
    // Update header
    document.getElementById('chatDetailName').textContent = `${firstName} ${lastName}`;
    document.getElementById('chatDetailContact').textContent = `${email} • ${phone}`;
    
    // Display messages
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML = messages.map(msg => {
        const senderClass = msg.sender === 'user' ? 'user' : (msg.sender === 'brett' ? 'brett' : 'bot');
        const senderName = msg.sender === 'user' ? firstName : (msg.sender === 'brett' ? 'You' : 'AI Assistant');
        
        return `
            <div class="message ${senderClass}">
                <div class="message-header">
                    <span class="message-sender">${senderName}</span>
                    <span class="message-time">${formatTime(msg.timestamp)}</span>
                </div>
                <div class="message-bubble">${msg.text}</div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: 'America/Los_Angeles'
    });
}

function closeChatDetail() {
    currentChatId = null;
    
    // Show chats list, hide chat detail
    document.getElementById('chatsSection').style.display = 'block';
    document.getElementById('chatDetail').style.display = 'none';
    
    // Clear input
    document.getElementById('replyInput').value = '';
    
    // Stop refreshing conversation, start refreshing list
    clearInterval(chatsRefreshInterval);
    loadChats();
    chatsRefreshInterval = setInterval(loadChats, 5000);
}

async function sendReply(event) {
    event.preventDefault();
    
    const input = document.getElementById('replyInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const button = event.target.querySelector('.send-button');
    button.disabled = true;
    button.textContent = 'Sending...';
    
    try {
        const response = await fetch(SEND_REPLY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId: currentChatId,
                reply: message
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send reply');
        }
        
        // Clear input
        input.value = '';
        
        // Refresh messages
        await loadChatMessages(currentChatId);
        
    } catch (error) {
        console.error('Error sending reply:', error);
        alert('Failed to send reply. Please try again.');
    } finally {
        button.disabled = false;
        button.textContent = 'Send Reply';
        input.focus();
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}
