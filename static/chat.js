document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatForm = document.getElementById('chat-form');
    const memoryList = document.getElementById('memory-list');
    
    
    function scrollToBottom() {
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
    
    
    function autoResizeInput() {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    }
    
    
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-element typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        chatBox.appendChild(typingDiv);
        scrollToBottom();
    }
    
    
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    
    function setFormDisabled(disabled) {
        messageInput.disabled = disabled;
        sendButton.disabled = disabled;
        sendButton.textContent = disabled ? 'Sending...' : 'Send';
    }

    function createChatElement(sender, message) {
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-element';

        const senderDiv = document.createElement('div');
        senderDiv.className = 'sender';
        senderDiv.textContent = `${sender}:`;

        const messageP = document.createElement('p');
        messageP.innerHTML = message;

        wrapper.appendChild(senderDiv);
        wrapper.appendChild(messageP);

        return wrapper;
    }

    document.querySelectorAll('pre > code[class^="language-"]').forEach(el => {
        if (!el.dataset.lang) {
        const match = el.className.match(/language-(\w+)/);
        if (match) {
            el.dataset.lang = match[1];
        }
        }
    });

    document.querySelectorAll('pre > code').forEach(code => {
        const pre = code.parentElement;

        
        const wrapper = document.createElement("div");
        wrapper.className = "code-block-wrapper";
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        
        const button = document.createElement("button");
        button.className = "copy-button";
        button.textContent = "Copy";
        wrapper.appendChild(button);

        
        button.addEventListener("click", () => {
            const text = code.textContent;
            navigator.clipboard.writeText(text).then(() => {
                button.textContent = "Copied!";
                setTimeout(() => button.textContent = "Copy", 1500);
            }).catch(err => {
                console.error("Copy failed", err);
                button.textContent = "Error";
            });
        });
    });

    document.querySelectorAll('pre > code[class^="language-"]').forEach(el => {
        if (!el.dataset.lang) {
        const match = el.className.match(/language-(\w+)/);
        if (match) {
            el.dataset.lang = match[1];
        }
        }
    });


    // --- memory timeline rendering ---

    const storageKey = "memory_timeline";

    function getMemoryTimeline() {
        const stored = localStorage.getItem(storageKey);
        return stored ? stored.split('\n').map(item => item.trim()).filter(Boolean) : [];
    }

    function saveMemoryTimeline(items) {
        const uniqueItems = [...new Set(items.map(i => i.trim()))]; // Avoid duplicates
        localStorage.setItem(storageKey, uniqueItems.join('\n'));
        renderList();
    }

    function renderList() {
        const ul = document.getElementById("memory-list");
        ul.innerHTML = "";
        const items = getMemoryTimeline();

        items.forEach((item, index) => {
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.textContent = item;

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.style.marginLeft = "10px";
            removeBtn.onclick = () => {
                const updatedItems = getMemoryTimeline();
                updatedItems.splice(index, 1);
                saveMemoryTimeline(updatedItems);
            };

            li.appendChild(span);
            li.appendChild(removeBtn);
            ul.appendChild(li);
        });

        document.getElementById("memory_timeline_input").value = getMemoryTimeline().join('\n');
    }

    // Clear all memory
    document.getElementById("clear-all").addEventListener("click", () => {
        localStorage.removeItem(storageKey);
        renderList();
    });

    // Run on load
    function loadInitialMemoryFromBackend() {
        const textarea = document.getElementById('initial-memory');
        const memoryData = textarea ? textarea.value.trim() : '';
        localStorage.setItem(storageKey, memoryData);
    }

    loadInitialMemoryFromBackend();
    renderList();
    
    
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        const userDiv = createChatElement('User', message);
        chatBox.appendChild(userDiv);
        
        
        messageInput.value = '';
        messageInput.style.height = 'auto';
        setFormDisabled(true);
        showTypingIndicator();
        scrollToBottom();
        
        
        const formData = new FormData();
        formData.append('message', message);
        formData.append('memory_timeline', getMemoryTimeline().join('\n'));
        
        fetch(window.location.href, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.redirected) {
                window.location.reload();
            } else {
                throw new Error('Unexpected response');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            removeTypingIndicator();
            setFormDisabled(false);
            
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'chat-element error';
            errorDiv.innerHTML = '<div class="sender">System:</div> Sorry, there was an error sending your message. Please try again.';
            chatBox.appendChild(errorDiv);
            scrollToBottom();
        });
    });
    
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
    
    
    messageInput.addEventListener('input', autoResizeInput);
    
    
    messageInput.focus();
    
    
    scrollToBottom();
    
    
    document.addEventListener('keydown', function(e) {
        
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            messageInput.focus();
        }
        
        
        if (e.key === 'Escape' && document.activeElement === messageInput) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
        }
    });
    
    
    chatBox.style.scrollBehavior = 'smooth';
});
