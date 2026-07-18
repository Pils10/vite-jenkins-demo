import './style.css'

document.querySelector('#app').innerHTML = `
  <section class="card">
    <p class="eyebrow">KIND · JENKINS · ARGO CD</p>
    <h1>Hello from the GitOps lab!</h1>
    <p>
      This page was built by Jenkins, stored as a container image,
      declared in Git, and reconciled by Argo CD.
    </p>
    <code>Change this text, push it, and watch dev update.</code>
	<p>This is Version 1.0.0 Production</p>
  </section>
`
