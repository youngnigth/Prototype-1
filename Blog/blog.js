// posts array
const posts = [
  {
    title: "Hello, World!",
    date: "June 20, 2025",
    summary: "Welcome to my new Media Blog! Here I’ll share ideas, projects, and insights on all things media and the web.",
    url: "posts/post-hello-world.html",
    style: "blue"
  },
  {
    title: "Block-Chain",
    date: "June 22, 2025",
    summary: "Let’s explore a new project that uses basic HTML, CSS, and JS to build something cool.",
    url: "posts/The-Block-Chain.html",
    style: "green"
  }
];

// render posts
function renderPosts(list) {
  const container = document.getElementById('posts');
  container.innerHTML = '';
  list.forEach(p => {
    const art = document.createElement('article');
    art.className = `post card ${p.style || 'blue'}`;
    art.innerHTML = `
      <h2><a href="${p.url}">${p.title}</a></h2>
      <div class="date">${p.date}</div>
      <p>${p.summary}</p>
      <a class="read-more" href="${p.url}">Read more →</a>
    `;
    container.appendChild(art);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // 1) Initial render & search filter
  renderPosts(posts);
  document.getElementById('search').addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    renderPosts(posts.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.summary.toLowerCase().includes(term)
    ));
  });

  // 2) Mobile nav toggle
  const navBtn = document.querySelector('.nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if (navBtn && mainNav) {
    navBtn.setAttribute('aria-expanded', 'false');
    navBtn.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      navBtn.setAttribute('aria-expanded', String(open));
    });
  }

  // 3) Web3Forms AJAX subscribe
  const subForm = document.getElementById('subscribe-form');
  if (subForm) {
    subForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = subForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        const res = await fetch(subForm.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(subForm)
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }

        const json = await res.json();
        if (json.success) {
          const thank = document.createElement('p');
          thank.textContent = '🎉 Thanks for subscribing!';
          thank.style.marginTop = '1rem';
          subForm.replaceWith(thank);
        } else {
          alert('Oops: ' + (json.message || 'Please try again.'));
          btn.disabled = false;
          btn.textContent = 'Subscribe';
        }
      } catch (err) {
        console.error('Subscription error:', err);
        alert(
          'Subscription failed. ' +
          'Make sure you’re serving this on http:// or https://, ' +
          'and that you’ve whitelisted this domain in your Web3Forms dashboard.'
        );
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });
  }
});
