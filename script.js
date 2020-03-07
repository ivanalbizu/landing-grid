class ShapeOverlays {
  constructor(elm) {
    this.elm = elm;
    this.path = elm.querySelectorAll('path');
    this.numPoints = 4;
    this.duration = 1000;
    this.delayPointsArray = [];
    this.delayPointsMax = 0;
    this.delayPerPath = 60;
    this.timeStart = Date.now();
    this.isOpened = false;
    this.isAnimating = false;
  }
  toggle() {
    this.isAnimating = true;
    for (var i = 0; i < this.numPoints; i++)
      this.delayPointsArray[i] = 0;
    if (this.isOpened === false) this.open();
    else this.close();
  }
  open() {
    this.isOpened = true;
    document.body.classList.add('is-menu-open');
    this.timeStart = Date.now();
    this.renderLoop();
  }
  close() {
    this.isOpened = false;
    document.body.classList.remove('is-menu-open');
    this.timeStart = Date.now();
    this.renderLoop();
  }
  updatePath(time) {
    const points = [];
    for (var i = 0; i < this.numPoints; i++) {
      const thisEase = (i % 2 === 1) ? ease.sineOut : ease.exponentialInOut;
      points[i] = (1 - thisEase(Math.min(Math.max(time - this.delayPointsArray[i], 0) / this.duration, 1))) * 100
    }

    let str = '';
    str += (this.isOpened) ? `M 0 0 H ${points[0]}` : `M ${points[0]} 0`;
    for (var i = 0; i < this.numPoints - 1; i++) {
      const p = (i + 1) / (this.numPoints - 1) * 100;
      const cp = p - (1 / (this.numPoints - 1) * 100) / 2;
      str += `C ${points[i]} ${cp} ${points[i + 1]} ${cp} ${points[i + 1]} ${p} `;
    }
    str += (this.isOpened) ? `H 100 V 0` : `H 0 V 0`;
    return str;
  }
  render() {
    if (this.isOpened) {
      for (var i = 0; i < this.path.length; i++) {
        this.path[i].setAttribute('d', this.updatePath(Date.now() - (this.timeStart + this.delayPerPath * i)));
      }
    } else {
      for (var i = 0; i < this.path.length; i++) {
        this.path[i].setAttribute('d', this.updatePath(Date.now() - (this.timeStart + this.delayPerPath * (this.path.length - i - 1))));
      }
    }
  }
  renderLoop() {
    this.render();
    if (Date.now() - this.timeStart < this.duration + this.delayPerPath * (this.path.length - 1) + this.delayPointsMax) {
      requestAnimationFrame(() => {
        this.renderLoop();
      });
    }
    else {
      this.isAnimating = false;
    }
  }
}

const isMobileDevice = () => {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};


const elFactory = (type, attributes, ...children) => {
  const el = document.createElement(type)

  for (key in attributes) {
    el.setAttribute(key, attributes[key])
  }

  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child))
    else el.appendChild(child)
  })

  return el
}

const sliptWords = words => {
  const fragment = new DocumentFragment();
  let globalIndex = 0;

  words.split(' ').forEach((word, iWord) => {
    const fragmentLetter = new DocumentFragment();

    word.split('').forEach((letter, iLetter) => {
      globalIndex++;
      const el = elFactory(
        'span',
        {
          'data-letter': `${letter}`,
          class: `letter`,
          style: `--letter-index:${iLetter+1}; --global-index: ${globalIndex};`
        },
        `${letter}`
      )
      fragmentLetter.appendChild(el);
    })

    const space = elFactory(
      'span',
      {
        'data-space': true,
        class: `space`
      },
      ` `
    )
    fragmentLetter.appendChild(space);

    const el = elFactory(
      'span',
      {
        'data-word': `${word}`,
        class: `word`,
        style: `--word-index:${iWord+1}`
      },
      fragmentLetter
    )
    fragment.appendChild(el);
  })

  return fragment;
}

const scrollIntoView = (href, delay) => {
  event.preventDefault();
  setTimeout(() => {
    document.querySelector(href).scrollIntoView({
      behavior: 'smooth'
    });
  }, delay);
}

const statusNavigation = el => {
  if (!el.nextElementSibling) document.querySelector('.js-next').style.display = 'none';
  else document.querySelector('.js-next').style.display = 'flex';

  if (!el.previousElementSibling) document.querySelector('.js-prev').style.display = 'none';
  else document.querySelector('.js-prev').style.display = 'flex';
}

const transitionTo = (to, timeout) => {
  document.body.classList.add('js-animating');
  const prev = document.querySelector('.slide--active')
  prev.classList.add('fade-out')
  prev.classList.remove('slide--active');

  to.classList.add('fade-in');
  statusNavigation(to);

  setTimeout(() => {
    document.body.classList.remove('js-animating');
    prev.classList.remove('fade-out');
    to.classList.remove('fade-in');
    to.classList.add('slide--active');
  }, timeout);
}

const handlerNavigation = (nav, timeout) => {
  let active = null;
  if (nav.classList.contains('js-next')) {
    active = document.querySelector('.slide--active').nextElementSibling;
  } else {
    active = document.querySelector('.slide--active').previousElementSibling;
  }

  transitionTo(active, timeout)
}

document.addEventListener('DOMContentLoaded', () => {
  const timeout = 1800;
  const navs = document.querySelectorAll('.js-navigation');
  navs.forEach(nav => {
    nav.addEventListener('click', handlerNavigation.bind(this, nav, timeout), false);
  });

  document.querySelectorAll('[href^="#"][data-split-word]').forEach(elem => {
    const href = elem.getAttribute('href');
    elem.addEventListener('click', () => scrollIntoView(href, 0));
  });

  let splits = document.querySelectorAll('[data-split-word]');

  splits.forEach(split => {
    let splitTextContent = split.textContent;

    split.innerHTML = '';
    split.appendChild(sliptWords(splitTextContent))
  })


  const elmHamburger = document.querySelector('.btn-ham');
  const menuLink = document.querySelectorAll('.menu__link');
  const elmOverlay = document.querySelector('.shape-overlays');
  const logo = document.querySelector('.logo');
  const overlay = new ShapeOverlays(elmOverlay);

  elmHamburger.addEventListener('click', () => {
    if (overlay.isAnimating) return false;
    overlay.toggle();
  });

  menuLink.forEach(elem => {
    elem.addEventListener('click', () => {
      if (overlay.isAnimating) return false;

      overlay.toggle();
      const href = elem.getAttribute('href');

      scrollIntoView(href, overlay.duration);
    });
  });

  logo.addEventListener('click', event => {
    if (overlay.isAnimating) return false;

    const href = event.target.getAttribute('href');
    const delay = overlay.isOpened ? overlay.duration : 0;

    if (overlay.isOpened) overlay.close();

    scrollIntoView(href, delay);
  });

  if (!isMobileDevice()) {
    const wakeyFixRequired = 'CSS' in window && typeof CSS.supports === 'function' && !CSS.supports('-webkit-appearance', 'none');

    const ROOT_CLASS = 'scrollscreen';
    document.documentElement.classList.add('custom-scroll');

    const createElement = (tag, name) => {
      const el = document.createElement(tag);
      el.className = `${ROOT_CLASS}--${name}`;
      return el;
    }

    const createScrollscreen = (root) => {

      const fragment = document.createDocumentFragment();
      [...root.childNodes].forEach(child => {
        fragment.appendChild(child);
      });

      const content = createElement('div', 'content');
      content.appendChild(fragment);
      root.appendChild(content);

      const track = createElement('div', 'track');
      root.appendChild(track);

      const slider = createElement('div', 'slider');
      track.appendChild(slider);

      let pendingFrame = null;

      const redraw = () => {

        cancelAnimationFrame(pendingFrame);

        pendingFrame = requestAnimationFrame(() => {

          const contentHeight = content.scrollHeight;
          const containerHeight = root.offsetHeight;
          const percentageVisible = containerHeight / contentHeight;
          const sliderHeight = percentageVisible * containerHeight;
          const percentageOffset = content.scrollTop / (contentHeight - containerHeight);
          const sliderOffset = percentageOffset * (containerHeight - sliderHeight);

          track.style.opacity = percentageVisible === 1 ? 0 : 1;

          slider.style.cssText = `
            height: ${sliderHeight}px;
            transform: translateY(${sliderOffset}px);
          `;
        });

      }

      content.addEventListener('scroll', redraw);
      window.addEventListener('resize', redraw);

      redraw();

      if (!wakeyFixRequired) return;

      const wakey = () => {
        requestAnimationFrame(() => {
          const offset = content.scrollTop;
          content.scrollTop = offset + 1;
          content.scrollTop = offset;
        });
      }

      root.addEventListener('mouseenter', wakey);

      wakey();
    }

    [...document.querySelectorAll(`.${ROOT_CLASS}`)].forEach(createScrollscreen);

  }

});
