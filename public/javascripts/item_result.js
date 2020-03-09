if (document.getElementById('successMsg')) {
  localStorage.setItem('newItem',`${document.getElementById('successMsg').value}`);
  window.location.assign('/items/new');
} else if (document.getElementById('errorMsg')) {
  localStorage.setItem('newItem',`${document.getElementById('errorMsg').value}`);
  window.location.assign('/items/new');
} else {
  alert('處理有誤，請確認後重新新增物品');
  window.location.assign('/');
}