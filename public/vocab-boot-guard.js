(() => {
  'use strict'
  let vocabRequested = false
  let restoringDashboard = false

  function setup() {
    const content = document.querySelector('#content')
    const dashboardButton = document.querySelector('.nav-btn[data-page="dashboard"]')
    if (!content || !dashboardButton) {
      setTimeout(setup, 80)
      return
    }

    document.addEventListener('click', event => {
      const navButton = event.target.closest?.('.nav-btn')
      if (navButton) vocabRequested = navButton.dataset.page === 'vocab'
    }, true)

    new MutationObserver(() => {
      const vocabularyView = content.querySelector('.vocab-page,.vocab-study-page,.vocab-done-page')
      if (!vocabularyView || vocabRequested || restoringDashboard) return
      restoringDashboard = true
      dashboardButton.click()
      queueMicrotask(() => { restoringDashboard = false })
    }).observe(content, { childList: true, subtree: true })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup)
  } else {
    setup()
  }
})()
