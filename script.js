const API_URL = 'http://localhost:3000/professors';
const professorList = document.getElementById('professorList');

async function fetchProfessors() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (result.message === 'success'){
            renderData(result.data);
        }
    } catch (error) {
        console.error('API 請求失敗:', error);
        professorList.innerHTML = '<p style="color:red;">無法連線至伺服器</p>';
    }
}

function renderData(dataArray){
    professorList.innerHTML = '';

    dataArray.forEach(prof => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <h2>${prof.name}</h2>
            <p class="description">${prof.description}</p>
        `;

        professorList.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', fetchProfessors);