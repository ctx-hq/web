/* --- Theme toggle --- */
function toggleTheme(){
  document.documentElement.classList.toggle('dark');
  try{localStorage.setItem('theme',document.documentElement.classList.contains('dark')?'dark':'light')}catch(e){}
}
document.getElementById('theme-toggle')?.addEventListener('click',toggleTheme);
document.getElementById('theme-toggle-mobile')?.addEventListener('click',toggleTheme);

/* --- Avatar fallback (CSP-safe alternative to inline onerror) --- */
document.querySelectorAll('img[data-avatar-fallback]').forEach(function(img){
  img.addEventListener('error',function(){img.style.display='none'});
});

/* --- Mobile nav --- */
document.getElementById('mobile-nav-toggle')?.addEventListener('click',function(){
  document.getElementById('mobile-nav')?.classList.toggle('hidden');
});

/* --- Copy buttons (swap only the text label, keep SVG icons) --- */
document.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest?e.target.closest('[data-copy]'):null;
  if(!btn)return;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(btn.dataset.copy).then(function(){
      var label=null;
      for(var i=btn.childNodes.length-1;i>=0;i--){
        if(btn.childNodes[i].nodeType===3){label=btn.childNodes[i];break;}
      }
      if(label){var o=label.textContent;label.textContent='Copied!';setTimeout(function(){label.textContent=o},1500);}
    }).catch(function(){});
  }
});

/* --- Install tabs --- */
document.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest?e.target.closest('[data-tab]'):null;
  if(!btn||!btn.closest('.install-tabs'))return;
  var tab=btn.dataset.tab,container=btn.closest('.install-tabs');
  container.querySelectorAll('[data-tab]').forEach(function(b){
    var isInstall=b.classList.contains('cn-install-tab');
    var cls=isInstall?'cn-install-tab-active':'cn-tabbed-input-tab-active';
    b.classList.toggle(cls,b.dataset.tab===tab);
  });
  container.querySelectorAll('[data-panel]').forEach(function(p){
    p.classList.toggle('hidden',p.dataset.panel!==tab);
  });
});

/* --- OS detection + toggle --- */
(function(){
  var os=/Win/.test(navigator.platform)?'windows':'unix';
  document.querySelectorAll('[data-os-panel]').forEach(function(p){
    p.classList.toggle('hidden',p.dataset.osPanel!==os);
  });
  document.querySelectorAll('[data-os-toggle]').forEach(function(b){
    b.classList.toggle('text-muted-foreground',b.dataset.osToggle!==os);
    b.classList.toggle('font-medium',b.dataset.osToggle===os);
  });
})();

document.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest?e.target.closest('[data-os-toggle]'):null;
  if(!btn)return;
  var os=btn.dataset.osToggle;
  var container=btn.closest('.os-toggle');
  if(!container||!container.parentElement)return;
  var scope=container.parentElement;
  scope.querySelectorAll('[data-os-panel]').forEach(function(p){
    p.classList.toggle('hidden',p.dataset.osPanel!==os);
  });
  container.querySelectorAll('[data-os-toggle]').forEach(function(b){
    b.classList.toggle('text-muted-foreground',b.dataset.osToggle!==os);
    b.classList.toggle('font-medium',b.dataset.osToggle===os);
  });
});

/* --- Home page type tabs (progressive enhancement) --- */
(function(){
  var tabs=document.querySelectorAll('[data-home-tab]');
  if(!tabs.length)return;
  var form=document.getElementById('search-form');
  if(!form)return;
  var searchInput=document.getElementById('search-input');
  if(!searchInput)return;
  var typeInput=form.querySelector('[data-search-type-input]');
  if(!typeInput){
    typeInput=document.createElement('input');
    typeInput.type='hidden';typeInput.name='type';typeInput.value='';
    typeInput.setAttribute('data-search-type-input','');
    form.prepend(typeInput);
  }
  tabs.forEach(function(tab){
    tab.addEventListener('click',function(e){
      var t=tab.getAttribute('data-home-tab')||'';
      var q=searchInput.value.trim();
      if(q){
        e.preventDefault();
        typeInput.value=t;
        form.requestSubmit?form.requestSubmit():form.submit();
      }
      /* When input is empty, let the browser follow the native href (/search?type=X) */
    });
  });
})();

/* --- Device login form --- */
(function(){
  var form=document.querySelector('[data-device-form]');
  if(!form)return;
  var input=form.querySelector('input[name="user_code"]');
  var btn=form.querySelector('button[type="submit"]');
  var msgLoading=form.querySelector('[data-device-msg="loading"]');
  var msgSuccess=form.querySelector('[data-device-msg="success"]');
  var msgError=form.querySelector('[data-device-msg="error"]');

  // Auto-uppercase as user types
  if(input){
    input.addEventListener('input',function(){
      var pos=input.selectionStart;
      input.value=input.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
      input.setSelectionRange(pos,pos);
    });
  }

  function showMsg(type,text){
    [msgLoading,msgSuccess,msgError].forEach(function(el){if(el)el.classList.add('hidden')});
    var target=type==='loading'?msgLoading:type==='success'?msgSuccess:msgError;
    if(target){
      if(text)target.textContent=text;
      target.classList.remove('hidden');
    }
  }

  form.addEventListener('submit',function(e){
    e.preventDefault();
    var code=input?input.value.trim():'';
    if(!code||code.length<6)return;

    showMsg('loading');
    if(btn)btn.disabled=true;
    if(input)input.readOnly=true;

    fetch('/api/device/authorize',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({user_code:code})
    }).then(function(res){
      return res.json().then(function(data){return{ok:res.ok,data:data}});
    }).then(function(result){
      if(result.ok){
        showMsg('success');
      }else{
        showMsg('error',result.data.message||'Authorization failed. Please try again.');
        if(btn)btn.disabled=false;
        if(input)input.readOnly=false;
      }
    }).catch(function(){
      showMsg('error','Network error. Please check your connection and try again.');
      if(btn)btn.disabled=false;
      if(input)input.readOnly=false;
    });
  });
})();

/* --- Create org form --- */
(function(){
  var form=document.querySelector('[data-create-org-form]');
  if(!form)return;
  var nameInput=document.getElementById('org-name');
  var preview=document.getElementById('org-name-preview');
  var submitBtn=form.querySelector('button[type="submit"]');
  var nameRe=new RegExp('^'+form.dataset.namePattern+'$');
  var nameMin=parseInt(form.dataset.nameMin,10)||2;
  var nameMax=parseInt(form.dataset.nameMax,10)||39;

  function updatePreview(){
    var v=nameInput.value;
    if(v&&preview){
      preview.classList.remove('hidden');
      var strong=preview.querySelector('strong');
      if(strong)strong.textContent='@'+v;
    }else if(preview){
      preview.classList.add('hidden');
    }
  }

  if(nameInput){
    nameInput.addEventListener('input',function(){
      var pos=nameInput.selectionStart;
      nameInput.value=nameInput.value.toLowerCase().replace(/[^a-z0-9-]/g,'');
      nameInput.setSelectionRange(pos,pos);
      updatePreview();
      // Remove error state on edit
      nameInput.classList.remove('cn-input-error');
      nameInput.removeAttribute('aria-invalid');
      nameInput.setAttribute('aria-describedby','org-name-hint');
      var errEl=document.getElementById('org-name-error');
      if(errEl)errEl.remove();
    });
  }

  function getNameError(v){
    if(!v)return 'Organization name is required.';
    if(v.length<nameMin||v.length>nameMax)return 'Name must be between '+nameMin+' and '+nameMax+' characters.';
    if(!nameRe.test(v))return 'Name can only contain lowercase letters, numbers, and hyphens, and must start and end with a letter or number.';
    return null;
  }

  function showNameError(msg){
    var existing=document.getElementById('org-name-error');
    if(existing)existing.remove();
    if(!msg||!nameInput)return;
    var el=document.createElement('p');
    el.id='org-name-error';
    el.className='cn-form-error mt-1.5';
    el.setAttribute('role','alert');
    el.textContent=msg;
    var hint=document.getElementById('org-name-hint');
    if(hint&&hint.parentNode)hint.parentNode.insertBefore(el,hint.nextSibling);
    else nameInput.parentNode.appendChild(el);
    nameInput.setAttribute('aria-describedby','org-name-hint org-name-error');
  }

  form.addEventListener('submit',function(e){
    var v=nameInput?nameInput.value.trim():'';
    var err=getNameError(v);
    if(err){
      e.preventDefault();
      if(nameInput){
        nameInput.classList.add('cn-input-error');
        nameInput.setAttribute('aria-invalid','true');
        nameInput.focus();
        showNameError(err);
      }
      return;
    }
    // Prevent double submit
    if(submitBtn){
      submitBtn.disabled=true;
      submitBtn.setAttribute('aria-disabled','true');
    }
  });
})();

/* --- Copy code blocks in prose (read from <code>, not <pre>) --- */
document.querySelectorAll('.prose pre').forEach(function(pre){
  var code=pre.querySelector('code');
  var btn=document.createElement('button');
  btn.textContent='Copy';
  btn.className='absolute top-2 right-2 px-2 py-0.5 text-xs bg-background border border-border text-muted-foreground hover:text-foreground';
  btn.setAttribute('data-copy-btn','');
  btn.onclick=function(){
    var text=code?code.textContent:pre.textContent||'';
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text||'').then(function(){
        btn.textContent='Copied!';
        setTimeout(function(){btn.textContent='Copy'},1500);
      }).catch(function(){});
    }
  };
  pre.style.position='relative';
  pre.appendChild(btn);
});
