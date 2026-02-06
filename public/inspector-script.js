(function() {
  let isInspectorActive = false;
  let inspectorStyle = null;
  let currentHighlight = null;
  let selectedElement = null;
  let editableElement = null;
  let isInlineEditing = false;

  const TEXT_TAGS = ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'label', 'li', 'strong', 'em', 'small'];

  // Function to get relevant styles
  function getRelevantStyles(element) {
    const computedStyles = window.getComputedStyle(element);
    const relevantProps = [
      'display', 'position', 'width', 'height', 'margin', 'padding',
      'border', 'background', 'color', 'font-size', 'font-family',
      'text-align', 'flex-direction', 'justify-content', 'align-items'
    ];
    
    const styles = {};
    relevantProps.forEach(prop => {
      const value = computedStyles.getPropertyValue(prop);
      if (value) styles[prop] = value;
    });
    
    return styles;
  }

  // Function to create a readable element selector
  function createReadableSelector(element) {
    let selector = element.tagName.toLowerCase();
    
    // Add ID if present
    if (element.id) {
      selector += `#${element.id}`;
    }
    
    // Add classes if present
    let className = '';
    if (element.className) {
      if (typeof element.className === 'string') {
        className = element.className;
      } else if (element.className.baseVal !== undefined) {
        className = element.className.baseVal;
      } else {
        className = element.className.toString();
      }
      
      if (className.trim()) {
        const classes = className.trim().split(/\s+/).slice(0, 3); // Limit to first 3 classes
        selector += `.${classes.join('.')}`;
      }
    }
    
    return selector;
  }

  // Function to create element display text
  function createElementDisplayText(element) {
    const tagName = element.tagName.toLowerCase();
    let displayText = `<${tagName}`;
    
    // Add ID attribute
    if (element.id) {
      displayText += ` id="${element.id}"`;
    }
    
    // Add class attribute (limit to first 3 classes for readability)
    let className = '';
    if (element.className) {
      if (typeof element.className === 'string') {
        className = element.className;
      } else if (element.className.baseVal !== undefined) {
        className = element.className.baseVal;
      } else {
        className = element.className.toString();
      }
      
      if (className.trim()) {
        const classes = className.trim().split(/\s+/);
        const displayClasses = classes.length > 3 ? 
          classes.slice(0, 3).join(' ') + '...' : 
          classes.join(' ');
        displayText += ` class="${displayClasses}"`;
      }
    }
    
    // Add other important attributes
    const importantAttrs = ['type', 'name', 'href', 'src', 'alt', 'title'];
    importantAttrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        const truncatedValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
        displayText += ` ${attr}="${truncatedValue}"`;
      }
    });
    
    displayText += '>';
    
    // Add text content preview for certain elements
    const textElements = ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'label'];
    if (textElements.includes(tagName) && element.textContent) {
      const textPreview = element.textContent.trim().substring(0, 50);
      if (textPreview) {
        displayText += textPreview.length < element.textContent.trim().length ? 
          textPreview + '...' : textPreview;
      }
    }
    
    displayText += `</${tagName}>`;
    
    return displayText;
  }

  // Function to create element info
  function createElementInfo(element) {
    const rect = element.getBoundingClientRect();
    
    return {
      tagName: element.tagName,
      className: getElementClassName(element),
      id: element.id || '',
      textContent: element.textContent?.slice(0, 100) || '',
      styles: getRelevantStyles(element),
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      // Add new readable formats
      selector: createReadableSelector(element),
      displayText: createElementDisplayText(element),
      elementPath: getElementPath(element)
    };
  }

  function isTextElement(element) {
    if (!element || !element.tagName) return false;
    const tagName = element.tagName.toLowerCase();
    if (TEXT_TAGS.includes(tagName)) return true;
    if (element.isContentEditable) return true;
    const text = element.textContent || '';
    return text.trim().length > 0;
  }

  function clearInlineEditing() {
    if (!editableElement) return;
    editableElement.removeAttribute('contenteditable');
    editableElement.removeAttribute('data-inspector-editable');
    editableElement.removeEventListener('blur', handleInlineBlur, true);
    editableElement.removeEventListener('input', handleInlineInput, true);
    editableElement = null;
    isInlineEditing = false;
  }

  function handleInlineInput() {
    if (!editableElement) return;
    const elementInfo = createElementInfo(editableElement);
    window.parent.postMessage({
      type: 'INSPECTOR_TEXT_UPDATED',
      elementInfo: elementInfo
    }, '*');
  }

  function handleInlineBlur() {
    if (!editableElement) return;
    const elementInfo = createElementInfo(editableElement);
    window.parent.postMessage({
      type: 'INSPECTOR_TEXT_UPDATED',
      elementInfo: elementInfo
    }, '*');
    clearInlineEditing();
  }

  function enableInlineEditing(element) {
    if (!isTextElement(element)) return;
    if (editableElement && editableElement !== element) {
      clearInlineEditing();
    }
    editableElement = element;
    editableElement.setAttribute('contenteditable', 'true');
    editableElement.setAttribute('data-inspector-editable', 'true');
    editableElement.focus();
    isInlineEditing = true;
    editableElement.addEventListener('blur', handleInlineBlur, true);
    editableElement.addEventListener('input', handleInlineInput, true);
  }

  // Helper function to get element class name consistently
  function getElementClassName(element) {
    if (!element.className) return '';
    
    if (typeof element.className === 'string') {
      return element.className;
    } else if (element.className.baseVal !== undefined) {
      return element.className.baseVal;
    } else {
      return element.className.toString();
    }
  }

  // Function to get element path (breadcrumb)
  function getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body && current !== document.documentElement) {
      let pathSegment = current.tagName.toLowerCase();
      
      if (current.id) {
        pathSegment += `#${current.id}`;
      } else if (current.className) {
        const className = getElementClassName(current);
        if (className.trim()) {
          const firstClass = className.trim().split(/\s+/)[0];
          pathSegment += `.${firstClass}`;
        }
      }
      
      path.unshift(pathSegment);
      current = current.parentElement;
      
      // Limit path length
      if (path.length >= 5) break;
    }
    
    return path.join(' > ');
  }

  // Event handlers
  function handleMouseMove(e) {
    if (!isInspectorActive) return;
    
    const target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;

    // Remove previous highlight
    if (currentHighlight) {
      currentHighlight.classList.remove('inspector-highlight');
    }
    
    // Add highlight to current element
    target.classList.add('inspector-highlight');
    currentHighlight = target;

    const elementInfo = createElementInfo(target);
    
    // Send message to parent
    window.parent.postMessage({
      type: 'INSPECTOR_HOVER',
      elementInfo: elementInfo
    }, '*');
  }

  function handleClick(e) {
    if (!isInspectorActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;

    selectedElement = target;
    const elementInfo = createElementInfo(target);
    
    // Send message to parent
    window.parent.postMessage({
      type: 'INSPECTOR_CLICK',
      elementInfo: elementInfo
    }, '*');

    if (isTextElement(target)) {
      enableInlineEditing(target);
    }
  }

  function handleMouseLeave() {
    if (!isInspectorActive) return;
    
    // Remove highlight
    if (currentHighlight) {
      currentHighlight.classList.remove('inspector-highlight');
      currentHighlight = null;
    }
    
    // Send message to parent
    window.parent.postMessage({
      type: 'INSPECTOR_LEAVE'
    }, '*');
  }

  // Function to activate/deactivate inspector
  function setInspectorActive(active) {
    isInspectorActive = active;
    
    if (active) {
      // Add inspector styles
      if (!inspectorStyle) {
        inspectorStyle = document.createElement('style');
        inspectorStyle.textContent = `
          .inspector-active * {
            cursor: crosshair !important;
          }
          .inspector-highlight {
            outline: 2px solid #3b82f6 !important;
            outline-offset: -2px !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
        `;
        document.head.appendChild(inspectorStyle);
      }
      
      document.body.classList.add('inspector-active');
      
      // Add event listeners
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('mouseleave', handleMouseLeave, true);
    } else {
      document.body.classList.remove('inspector-active');
      
      // Remove highlight
      if (currentHighlight) {
        currentHighlight.classList.remove('inspector-highlight');
        currentHighlight = null;
      }

      clearInlineEditing();
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      
      // Remove styles
      if (inspectorStyle) {
        inspectorStyle.remove();
        inspectorStyle = null;
      }
    }
  }

  // Listen for messages from parent
  window.addEventListener('message', function(event) {
    if (event.data.type === 'INSPECTOR_ACTIVATE') {
      setInspectorActive(event.data.active);
    } else if (event.data.type === 'INSPECTOR_SET_TEXT') {
      if (selectedElement && isTextElement(selectedElement)) {
        selectedElement.textContent = event.data.text || '';
        const elementInfo = createElementInfo(selectedElement);
        window.parent.postMessage({
          type: 'INSPECTOR_TEXT_UPDATED',
          elementInfo: elementInfo
        }, '*');
      }
    }
  });

  // Auto-inject if inspector is already active
  window.parent.postMessage({ type: 'INSPECTOR_READY' }, '*');
})();
