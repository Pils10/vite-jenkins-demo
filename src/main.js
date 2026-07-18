import './style.css'

document.querySelector('#app').innerHTML = `
  <section class="card">
    <p class="eyebrow">KIND · JENKINS · ARGO CD</p>
    <h1>Big change and issues fixed!!</h1>
    <p>
      This page was built by Jenkins, stored as a container image,
      declared in Git, and reconciled by Argo CD.
    </p>
    <code>Change this text, push it, and watch dev update.</code>
	<p>Last Check before publish</p>
  </section>
`
