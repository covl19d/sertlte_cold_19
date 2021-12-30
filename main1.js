(function () {
  window.APP = {
    lang: 'ru',
    toogleLang: function () {
      this.lang = this.lang === 'en' ? 'ru' : 'en';
      var queryParams = new URLSearchParams(window.location.search);
      queryParams.set("lang", this.lang);
      window.history.replaceState(null, null, "?" + queryParams.toString());
      this.init();
    },
    getValue: function (cert, fieldName) {
      if (cert) {
        return cert[fieldName];
      } else {
        return this[fieldName];
      }
    },
    setContainerImage: function (cert) {
      var cls = '';
      var self = this;
      if (cert.invalid) {
        cls = 'invalid';
        self.certStatusName = 'Не действителен';
        self.encertStatusName = 'Invalid';
      } else {
        cls = 'complete';
        self.certStatusName = 'Действителен';
        self.encertStatusName = 'Valid';
      }
      return cls;
    },
    filterAttrs: function (cert, targetNames) {
      return cert.attrs.filter(function (attr) {
        return targetNames.indexOf(attr.type) !== -1 && attr.value;
      });
    },
    showAttrs: function (cert) {
      var attrsContainer = document.querySelector('.person-data-attrs');
      attrsContainer.innerHTML = '';
      var self = this;

      if (cert.invalid) {
        attrsContainer.classList.add('hide');
      } else {
        if (self.lang === 'ru') {
          attrsContainer.innerHTML += `<div class="mb-4 person-data-wrap attr-wrap"><div class="attrValue title-h6 bold text-center">${self.getValue(cert, "fio")}</div></div>`;
          attrsContainer.innerHTML += `<div class="mb-4 person-data-wrap attr-wrap"><div class="small-text mb-4 mr-4 attr-title">Паспорт: </div><div class="attrValue small-text gray">${self.getValue(cert, "doc")}</div></div>`;
          attrsContainer.innerHTML += `<div class="mb-4 person-data-wrap attr-wrap"><div class="small-text mb-4 mr-4 attr-title">Дата рождения: </div><div class="attrValue small-text gray">${self.getValue(cert, "birthdate")}</div></div>`;

        } else if (self.lang === 'en') {
          attrsContainer.innerHTML += `<div class="mb-4 person-data-wrap attr-wrap"><div class="attrValue title-h6 bold text-center">${self.getValue(cert, "enFio")}</div></div>`;
          attrsContainer.innerHTML += `<div class="mb-4 person-data-wrap attr-wrap"><div class="small-text mb-4 mr-4 attr-title">Рassport (ID number): </div><div class="attrValue small-text gray">${self.getValue(cert, "doc") || 'Not specified'}</div></div>`;
          attrsContainer.innerHTML += `<div class="mb-4 person-data-wrap attr-wrap"><div class="small-text mb-4 mr-4 attr-title">International passport (ID number): </div><div class="attrValue small-text gray">${self.getValue(cert, "enDoc") || 'Not specified'}</div></div>`;
          attrsContainer.innerHTML += `<div class="mb-4 person-data-wrap attr-wrap"><div class="small-text mb-4 mr-4 attr-title">Date of birth: </div><div class="attrValue small-text gray">${self.getValue(cert, "birthdate")}</div></div>`;
        }
      }
    },
    getParam: function (paramName) {
      var queryString = window.location.search;
      var urlParams = new URLSearchParams(queryString);
      return urlParams.get(paramName)
    },
    fadeOutEffect(elem) {
      const fadeEffect = setInterval(() => {
        if (elem && !elem.style.opacity) {
          elem.style.opacity = '1';
        }
        if (elem && parseFloat(elem.style.opacity) > 0) {
          elem.style.opacity = (parseFloat(elem.style.opacity) - 0.5) + '';
        } else if (elem) {
          clearInterval(fadeEffect);
          elem.parentNode.removeChild(elem);
        }
      }, 10);
    },
    init: function () {
      document.body.classList.add('loading');
      var self = this;
      var certId = window.location.pathname.split("/").filter((segment) => !!segment).pop();;
      var unrz = window.location.pathname.indexOf("/unrz/") > -1;
      var url = self.config.vaccineUrl + 'cert/verify/' + (unrz ? '/unrz/' : '') + certId;
      var lang = this.getParam('lang');
      this.lang = lang || 'ru';
      if (lang) {
        url += `?lang=${lang}`;
      }

      function showData(data) {
        var cert = data;
        self.cert = cert;

        document.body.classList.remove('loading');
        self.fadeOutEffect(document.getElementById('start-app-loader'));

        var unrz = document.querySelector('.unrz');
        var num = document.querySelector('.num-symbol');

        self.showAttrs(cert);

        var statusContainerCls = self.setContainerImage(cert);
        if (statusContainerCls) {
          document.querySelector('.status-container').classList.add(self.setContainerImage(cert));
        }

        if (cert.unrz) {
          unrz.innerHTML = cert.unrz;
        } else {
          unrz.classList.add('hide');
          num.classList.add('hide');
        }

        self.setText(cert);
      }

      if (!self.cert) {
        fetch(url, {
          method: 'GET',
          credentials: "include",
        }).then(function (response) {
          return response.json();
        }).then(function (data) {
          if (data) {
            showData(data);
          } else {
            showData(self.emptyState());
          }
        }, function () {
          document.body.classList.remove('loading');
          showData(self.emptyState());
        });
      } else {
        showData(self.cert);
      }

    },
    getConfig: function () {
      return window.APP_HELPERS.getCovidAppConfig().then((function (config) {
        this.config = config;
        return true;
      }).bind(this));
    },
    emptyState: function () {
      return {
        title: 'Сертификат о вакцинации COVID-19',
        entitle: 'Certificate of COVID-19 Vaccination',
        invalid: 'Не действителен',
        eninvalid: 'Invalid',
      }
    },
    setText: function (cert) {
      var langImage = document.querySelector('.lang-image');
      document.querySelector('.main-title').innerHTML = this.getValue(this.emptyState(), (this.lang === 'ru' ? '' : 'en') + 'title');
      document.querySelector('.button').innerHTML = this.lang === 'ru' ? 'Закрыть' : 'Close';
      document.querySelector('.lang').innerHTML = this.lang === 'ru' ? 'RUS' : 'ENG';
      langImage.classList.remove('ru', 'en');
      langImage.classList.toggle(this.lang);

      if (cert.invalid) {
        var notFound = document.querySelector('.not-found');
        notFound.classList.remove('hide');
        notFound.innerHTML = this.getValue('', (this.lang === 'en' ? 'en' : '') + 'certStatusName');
      } else {
        var certName = document.querySelector('.cert-name');
        certName.classList.remove('hide');
        certName.innerHTML = this.getValue('', (this.lang === 'en' ? 'en' : '') + 'certStatusName')
      }
    }
  }
  APP.getConfig().then(function () {
    APP.init();
  })
})();
