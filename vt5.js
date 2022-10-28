"use strict";

let mymap;
  
  window.onload = function () {
  
      // Piirretään kartta ja määritetään sen koko.
      let div = $("#map");
      div.css("width", "100" + "%");
      div.css("height", "45" + "%");
  
      mymap = new L.map('map', {
          crs: L.TileLayer.MML.get3067Proj()
      }).setView([62.2333, 25.7333], 11);
      L.tileLayer.mml_wmts({ layer: "maastokartta", key: "35dce269-3582-42c0-abb9-79b33ce43613" }).addTo(mymap);
  
      // Järjestellään joukkueet aakkosjärjestykeen apumuuttujaan.
      let joukkueet = data.joukkueet.slice();
  
      joukkueet.sort(function (a, b) {
          let keyA = a.nimi.toUpperCase();
          let keyB = b.nimi.toUpperCase();
  
          if (keyA < keyB) {
              return -1;
          }
          if (keyA > keyB) {
              return 1;
          }
          return 0;
      });
  
      let rastit = data.rastit.slice();
  
      // Järjestellään rastit käänteiseen aakkosjärjestykeen apumuuttujaan.
      rastit.sort(function (a, b) {
          let keyA = a.koodi,
              keyB = b.koodi;
          // Compare the 2 dates
          if (keyA > keyB) {
              return -1;
          }
          if (keyA < keyB) {
              return 1;
          }
          return 0;
      });
  
      let boksienKoko = 0;    // Tallennetaan tähän joukkue-divien kokonaiskorkeus, jonka perusteella määritetään joukkueet-divin korkeus.
  
      for (let i in joukkueet) {
          let div1 = document.createElement('div');
          div1.className = 'joukkue';
          div1.setAttribute('id', "joukkue" + joukkueet[i].id);
          //div1.setAttribute('draggable', 'true');
          div1.style.backgroundColor = rainbow(joukkueet.length, i);
          let a1 = document.createElement('a');
          div1.appendChild(a1);
          let txt1 = document.createTextNode(joukkueet[i].nimi);
          a1.appendChild(txt1);
          a1.setAttribute('draggable', 'true');
          let a2 = document.createElement('a');
          //a1.setAttribute('id', "joukkue" + joukkueet[i].id);
          div1.appendChild(a2);
          let txt2 = document.createTextNode(' (0 km)');
          a2.appendChild(txt2);
  
          div1.joukkueenTiedot = joukkueet[i];
          document.querySelector("#joukkueetBoksi").appendChild(div1);
          boksienKoko += div1.offsetHeight;
      }
  
      let joukkueBoksit = document.getElementsByClassName("joukkue");
  
      paivitaJoukkueidenMatkat();
  
      // Määritetään divien korkeus.
      $('#joukkueetBoksi').css('height', boksienKoko);
      $('#rastitBoksi').css('height', boksienKoko);
      $('#kartallaBoksi').css('height', boksienKoko);
  
  
      // Luodaan rasti-divit ja lisätään ne rastit-diviin.
      $(rastit).each(function (index) {
          let vari = rainbow(rastit.length, index);
          let rastiDiv = $("<div></div>");
          $(rastiDiv).text(this.koodi);
          $(rastiDiv).addClass("rasti");
          $(rastiDiv).attr('id', "rasti" + "-" + (this.id));
          $(rastiDiv).css("background-color", vari);
          $(rastiDiv).attr("draggable", "true");
          $(rastiDiv).css("width", "100px");
  
          $(rastiDiv).appendTo("#rastitBoksi");
      });
  
      //Asetetaan drag and drop -tapahtumankäsittelijät
      let rastiBoksit = document.getElementsByClassName("rasti");
  
      for (let i = 0; i < joukkueBoksit.length; i++) {
          joukkueBoksit[i].getElementsByTagName('a')[0].addEventListener("dragstart", dragstart_handler);
          //joukkueBoksit[i].addEventListener("dragstart", dragstart_handler);
      }
  
      for (let i = 0; i < rastiBoksit.length; i++) {
          rastiBoksit[i].addEventListener("dragstart", dragstart_handler2);
      }
  
      let drop = document.getElementById("kartallaBoksi");
      let drop2 = document.getElementById("rastitBoksi");
      let drop3 = document.getElementById("joukkueetBoksi");
  
      drop.addEventListener("dragover", dragover_handler);
      drop2.addEventListener("dragover", dragover_handler);
      drop3.addEventListener("dragover", dragover_handler);
  
      drop.addEventListener("drop", kartallaDrop);
      drop2.addEventListener("drop", rastitDrop);
      drop3.addEventListener("drop", joukkueetDrop);
  
      let etelaisinRasti = [Number.MAX_VALUE];
      let pohjoisinRasti = [Number.MIN_VALUE];
  
  
  
      // Piirretään rastit kartalle ja etsitään pohjoisin ja eteläisin rasti, joiden perusteella keskitetään kartta.
      for (let i of data.rastit) {
          let circle = L.circle(
              [i.lat, i.lon], {
              color: 'red',
              fillOpacity: 0.0,
              radius: 150
          }).addTo(mymap);
  
          circle.rasti = i;
          
          
  
          circle.bindTooltip(i.koodi, {
              permanent: true,
              direction: "center",
              className: "my-labels"
          }).openTooltip();
  
  
          circle.addEventListener('click', rastinKlikkaus);
  
          if (etelaisinRasti[0] > i.lat) {
              etelaisinRasti = [i.lat, i.lon];
          }
          if (pohjoisinRasti[0] < i.lat) {
              pohjoisinRasti = [i.lat, i.lon];
          }
      }
      
  
  
  
  
  
  
  
  
      // Keskitetään kartta.
      let corner1 = L.latLng(etelaisinRasti),
          corner2 = L.latLng(pohjoisinRasti),
          bounds = L.latLngBounds(corner1, corner2);
      mymap.fitBounds(bounds);
  
  
  };
  
  function dragstart_handler(e) {
      e.dataTransfer.setData("text/plain", this.parentElement.getAttribute("id"));
  }
  
  function dragstart_handler2(e) {
      e.dataTransfer.setData("text/plain", this.getAttribute("id"));
  }
  
  function dragstart_handler3(e) {
      e.dataTransfer.setData("text/plain", this.getAttribute.parentElement.parentElement("id"));
  }
  
  let marker;
  let valittuPallo;
  
  function rastinKlikkaus(e) {
  
      if (marker != undefined) {
          marker.remove();
      }
  
      if (valittuPallo != undefined) {
          valittuPallo.setStyle({ fillOpacity: '0' });
      }
  
      valittuPallo = e.target;
  
      let pallo = e.target;
  
      pallo.setStyle({ fillOpacity: '1.0' });
  
      let lat = e.latlng.lat;
      let lon = e.latlng.lng;
      marker = new L.marker([lat, lon], {
          draggable: 'true'
      });
      marker.addTo(mymap);
  
      marker.addEventListener("dragend", function (e) {
          let circle = L.circle(
              [e.target._latlng.lat, e.target._latlng.lng], {
              color: 'red',
              fillOpacity: 0.0,
              radius: 150
          }).addTo(mymap);
  
          circle.addEventListener('click', rastinKlikkaus);
  
          circle.rasti = pallo.rasti;
  
          circle.rasti.lat = e.target._latlng.lat;
          circle.rasti.lon = e.target._latlng.lng;
  
          circle.bindTooltip(circle.rasti.koodi, {
              permanent: true,
              direction: "center",
              className: "my-labels"
          }).openTooltip();
  
          for (let i of data.rastit) {
              if (circle.rasti.id == i.id) {
                  i.lat = e.target._latlng.lat;
                  i.lon = e.target._latlng.lng;
              }
          }
  
          let piirretytJoukkueet = document.querySelector("#kartallaBoksi").querySelectorAll('details');
  
          for (let i of piirretytReitit) {
              i.remove();
          }
  
          for (let i of piirretytJoukkueet) {
              piirraReitti(i.alkuperainenBoksi);
          }
  
          pallo.remove();
  
          marker.remove();
  
          paivitaJoukkueidenMatkat();
      });
  }
  
  function paivitaJoukkueidenMatkat() {
      let lisaamattomatJoukkueet = document.getElementsByClassName("joukkue");
      let matka;
  
      for (let i of lisaamattomatJoukkueet) {
          matka = joukkueenReitinPituun(i);
          i.getElementsByTagName('a')[1].text = ' (' + Number((matka).toFixed(1)) + ' km)';
      }
  
      let lisatutJoukkueet = document.querySelector("#kartallaBoksi").querySelectorAll('details');
  
      for (let i of lisatutJoukkueet) {
          matka = joukkueenReitinPituun(i.alkuperainenBoksi);
          i.alkuperainenBoksi.getElementsByTagName('a')[1].text = ' (' + Number((matka).toFixed(1)) + ' km)';
          i.getElementsByTagName('a')[1].text = ' (' + Number((matka).toFixed(1)) + ' km)';
      }
  }
  
  function haeRastinKoodi(rasti) {
      for (let i of data.rastit) {
          if (rasti == i.id) {
              return i.koodi;
          }
      }
  }
  
  function haeRastit(joukkue) {
      let joLeimatut = [];
      let validitRastit = [];
      let rastit = joukkue.rastit;
  
      console.log(joLeimatut);
  
      for (let i in rastit) {
          if (rastit[i].rasti != 0) {
              if (!isNaN(parseInt(rastit[i].rasti)) && !joLeimatut.includes(rastit[i].rasti)) {
                  validitRastit.push(haeRastinKoodi(parseInt(rastit[i].rasti)));
                  //joLeimatut.push(rastit[i].rasti);
              }
          }
      }
  
      return validitRastit;
  }
  
  function haeIndeksit(joukkue) {
      let rastit = joukkue.rastit;
      let indeksit = [];
  
      for (let i in rastit) {
          if (rastit[i].rasti != 0) {
              if (!isNaN(parseInt(rastit[i].rasti))) {
                  indeksit.push(i);
              }
          }
      }
  
      return indeksit;
  }
  
  // Käsitellään elementin pudottaminen Kartalla-diviin.
  function kartallaDrop(e) {
      if (e.target != document.getElementById("kartallaBoksi")) {
          return;
      }
  
      e.preventDefault();
      let tieto = e.dataTransfer.getData("text");
      let raahattava = document.getElementById(tieto);
  
      if (raahattava.tagName == 'DIV' && raahattava.parentElement.parentElement.parentElement == document.getElementById('kartallaBoksi')) {
          raahattava = raahattava.parentElement.parentElement;
      }
  
      if (raahattava.className == 'joukkueKartallaNimi') {
          raahattava = raahattava.parentElement.parentElement;
      }
  
      let rect = document.body.getBoundingClientRect();
      let mouseX = e.clientX - rect.left;
      let mouseY = e.clientY - rect.top;
  
      if (raahattava.className == 'joukkue' || raahattava.className == 'joukkueKartalla') {
          if (raahattava.className == 'joukkue') {
              let nimi = raahattava.getElementsByTagName('a');
  
              let details1 = document.createElement('details');
              let summary1 = document.createElement('summary');
              details1.style.backgroundColor = raahattava.style.backgroundColor;
              details1.style.position = "absolute";
              details1.setAttribute('class', 'joukkueKartalla');
              details1.appendChild(summary1);
  
              details1.alkuperainenBoksi = raahattava;
  
  
              let a1 = document.createElement('a');
              a1.setAttribute('draggable', 'true');
              a1.setAttribute('id', 'kartalla' + "-" + raahattava.joukkueenTiedot.id);
              a1.setAttribute('class', 'joukkueKartallaNimi');
              summary1.appendChild(a1);
              let txt3 = document.createTextNode(nimi[0].textContent);
              a1.appendChild(txt3);
              let a2 = document.createElement('a');
              summary1.appendChild(a2);
              let txt4 = document.createTextNode(nimi[1].textContent);
              a2.appendChild(txt4);
  
              let ul1 = document.createElement('ul');
              ul1.addEventListener("dragover", dragover_handler);
              ul1.addEventListener("drop", rastiDrop);
              details1.appendChild(ul1);
  
  
              let validitRastit = haeRastit(raahattava.joukkueenTiedot);
              let indeksit = haeIndeksit(raahattava.joukkueenTiedot);
  
              
  
              for (let i in validitRastit) {
                  let li1 = document.createElement('li');
                  li1.setAttribute('draggable', 'true');
                  li1.setAttribute('class', 'koodi');
                  li1.setAttribute('id', raahattava.joukkueenTiedot.nimi.trim() + '-' + 'rasti' + '-' + i);
                  li1.addEventListener("dragstart", dragstart_handler2);
                  li1.rastinIndeksi = indeksit[i];
                  ul1.appendChild(li1);
                  let txt7 = document.createTextNode(validitRastit[i]);
                  li1.appendChild(txt7);
              }
  
              e.target.appendChild(details1);
  
              details1.style.left = mouseX - (summary1.offsetWidth / 2) + 'px';
              details1.style.top = mouseY - (summary1.offsetHeight / 2) + 'px';
              let reitti = piirraReitti(raahattava);
              raahattava.reitti = reitti;
  
              //ul1.style.position = "absolute";
              //ul1.style.left = parseInt(summary1.style.left) + 'px';
              //ul1.style.top = parseInt(summary1.style.top) + 5 + 'px';
  
              a1.addEventListener("dragstart", dragstart_handler2);
              raahattava.remove();
          }
  
          if (raahattava.className == 'joukkueKartalla') {
              raahattava.style.left = mouseX - (document.getElementsByTagName('summary')[0].offsetWidth / 2) + 'px';
              raahattava.style.top = mouseY - (document.getElementsByTagName('summary')[0].offsetHeight / 2) + 'px';
          }
      }
  
      if (raahattava.className == 'rasti') {
  
  
      
  
  
  
      
          if (raahattava == null) {
              return;
          }
      
          let vanhempi = raahattava.parentElement.getAttribute("id");
      
          if (e.target.getAttribute("id") !== "kartallaBoksi") {
              e.target.parentElement.appendChild(raahattava);
          } else {
              e.target.appendChild(raahattava);
          }
      
          if (raahattava.getAttribute("class") === "joukkue" && vanhempi !== "kartallaBoksi") {
              reitti = piirraReitti(raahattava);
              raahattava.reitti = reitti; // Tallennetaan joukkueen kulkema reitti joukkue-diviin myöhempää poistamista varten.
          }
      
          if (raahattava.getAttribute("class") === "rasti" && vanhempi !== "kartallaBoksi") {
              $(raahattava).css("width", "");
          }
      
          // Lasketaan kohta, johon elementti pudotetaan.
          rect = document.body.getBoundingClientRect();
          mouseX = e.clientX - rect.left;
          mouseY = e.clientY - rect.top;
      
          raahattava.style.position = "absolute";
          raahattava.style.left = mouseX - (raahattava.offsetWidth / 2) + 'px';
          raahattava.style.top = mouseY - (raahattava.offsetHeight / 2) + 'px';
          
  
      }
  }
  
  // Käsitellään elementin pudottaminen Rastit-diviin.
  function rastitDrop(e) {
      e.preventDefault();
      let tieto = e.dataTransfer.getData("text");
      let rasti = document.getElementById(tieto);
  
      if (rasti == null) {
          return;
      }
  
      if (rasti.getAttribute("class") === "rasti") {
          if (e.target.getAttribute("class") === "rasti") {
  
              let rastit = e.target.parentElement.childNodes;
  
              let apu;
              let apu2;
  
              for (let i in rastit) {
                  if (e.target == rastit[i]) {
                      apu = rastit[i];
                      rastit[i].replaceWith(rasti);
                      let j = parseInt(i) + 1;
                      while (j < rastit.length) {
                          apu2 = rastit[j];
                          rastit[j].replaceWith(apu);
                          apu = apu2;
                          j++;
                      }
                      rastit[0].parentElement.appendChild(apu);
                      break;
                  }
              }
          } else {
              e.target.appendChild(rasti);
          }
          rasti.style.position = "relative";
          rasti.style.left = "";
          rasti.style.top = "";
          $(rasti).css("width", "100");
      }
  }
  
  function rastiDrop(e) {
      e.preventDefault();
      let tieto = e.dataTransfer.getData("text");
      let raahattava = document.getElementById(tieto);
  
      if (raahattava.className == "rasti") {
          return;
      }
  
      if (raahattava.parentElement == e.target.parentElement && raahattava != e.target) {
  
          let rastit = raahattava.parentElement.childNodes;
  
          let apu;
          let apu2;
          let j;
  
          raahattava.remove();
  
          for (let i in rastit) {
              if (e.target == rastit[i]) {
                  apu = rastit[i];
                  rastit[i].replaceWith(raahattava);
                  j = parseInt(i) + 1;
                  while (j < rastit.length) {
                      apu2 = rastit[j];
                      rastit[j].replaceWith(apu);
                      apu = apu2;
                      j++;
                  }
                  rastit[0].parentElement.appendChild(apu);
                  break;
              }
          }
  
          let joukkue = raahattava.parentElement.parentElement.alkuperainenBoksi.joukkueenTiedot;
          let joukkueenRastit = joukkue.rastit;
  
  
          apu = "";
          apu2 = "";
          j = "";
  
          let raahattavaRasti = joukkueenRastit[raahattava.rastinIndeksi];
          let kohdeRasti = joukkueenRastit[e.target.rastinIndeksi];
  
          joukkueenRastit.splice(raahattava.rastinIndeksi, 1);
  
          for (let i in joukkueenRastit) {
              if (kohdeRasti == joukkueenRastit[i]) {
                  apu = joukkueenRastit[i];
                  joukkueenRastit[i] = raahattavaRasti;
                  j = parseInt(i) + 1;
                  while (j < joukkueenRastit.length) {
                      apu2 = joukkueenRastit[j];
                      joukkueenRastit[j] = apu;
                      apu = apu2;
                      j++;
                      //joukkueenRastit.splice(i, 1);
                  }
                  joukkueenRastit.push(apu);
                  break;
              }
          }
  
          let validitRastit = haeRastit(joukkue);
          let indeksit = haeIndeksit(joukkue);
  
          console.log(validitRastit.length);
          console.log(indeksit.length);
  
          //for (let i in validitRastit) {
          //    li1.rastinIndeksi = indeksit[i];
          //}
  
          for (let i in validitRastit) {
              raahattava.parentElement.getElementsByTagName('li')[i].rastinIndeksi = indeksit[i];
          }
  
          raahattava.parentElement.parentElement.alkuperainenBoksi.reitti.remove();
          let reitti = piirraReitti(raahattava.parentElement.parentElement.alkuperainenBoksi);
          raahattava.parentElement.parentElement.alkuperainenBoksi.reitti = reitti;
      }
  
  
  
      joukkueenReitti2(joukkue);
  }
  
  // Käsitellään elementin pudottaminen Joukkueet-diviin.
  function joukkueetDrop(e) {
      e.preventDefault();
      let tieto = e.dataTransfer.getData("text");
      let joukkue = document.getElementById(tieto);
  
      if (joukkue.className == 'joukkueKartallaNimi') {
          let detailsBoksi = joukkue.parentElement.parentElement;
          joukkue = joukkue.parentElement.parentElement.alkuperainenBoksi;
          detailsBoksi.remove();
      }
  
      if (joukkue.className != 'joukkue' && joukkue.className != 'joukkueKartalla') {
          return;
      }
  
      if (e.target.parentElement != joukkue) {
          joukkue.remove();
  
          if (joukkue.getAttribute("class") === "joukkue") {
              if (e.target.parentElement.getAttribute("class") === "joukkue") {
  
                  let joukkueet = e.target.parentElement.parentElement.childNodes;
  
                  let apu;
                  let apu2;
  
                  for (let i in joukkueet) {
                      if (e.target.parentElement == joukkueet[i]) {
                          apu = joukkueet[i];
                          joukkueet[i].replaceWith(joukkue);
                          let j = parseInt(i) + 1;
                          while (j < joukkueet.length) {
                              apu2 = joukkueet[j];
                              joukkueet[j].replaceWith(apu);
                              apu = apu2;
                              j++;
                          }
                          joukkueet[0].parentElement.appendChild(apu);
                          break;
                      }
                  }
              } else {
                  e.target.appendChild(joukkue);
              }
              if (joukkue.reitti != undefined) {
                  joukkue.reitti.remove();
                  joukkue.style.position = "relative";
                  joukkue.style.left = "";
                  joukkue.style.top = "";
              }
          }
      }
  }
  
  function dragover_handler(e) {
      e.preventDefault();
      // Set the dropEffect to move
      e.dataTransfer.dropEffect = "move";
  }
  
  function joukkueenReitinPituun(joukkue) {
      let reitinPituus = 0;
      let rastienKoordinaatit = joukkueenReitti(joukkue);
  
      for (let i = 0; i < rastienKoordinaatit.length - 1; i++) {
          reitinPituus += getDistanceFromLatLonInKm(rastienKoordinaatit[i][0], rastienKoordinaatit[i][1], rastienKoordinaatit[i + 1][0], rastienKoordinaatit[i + 1][1]);
      }
  
      return reitinPituus;
  }
  
  function joukkueenReitti(joukkue) {
  
      let joukkueenRastit = [];
  
      for (let i of joukkue.joukkueenTiedot.rastit) {
          if (i.rasti != 0) {
              //joukkueenRastit.push(parseInt(i.rasti));
              if (!isNaN(parseInt(i.rasti))) {
                  joukkueenRastit.push(parseInt(i.rasti));
              }
          }
      }
  
      let rastienKoordinaatit = [];
  
      for (let i of joukkueenRastit) {
          for (let j of data.rastit) {
              if (parseInt(j.id) === i) {
                  rastienKoordinaatit.push([parseFloat(j.lat), parseFloat((j.lon))]);
              }
          }
      }
  
      return rastienKoordinaatit;
  }
  
  
  
  
  
  function joukkueenReitti2(joukkue) {
  
      let joukkueenRastit = [];
  
      for (let i of joukkue.rastit) {
          if (i.rasti != 0) {
              //joukkueenRastit.push(parseInt(i.rasti));
              if (!isNaN(parseInt(i.rasti))) {
                  joukkueenRastit.push(parseInt(i.rasti));
              }
          }
      }
  
      console.log("     ");
      console.log("     ");
      console.log("     ");
      console.log("     ");
      console.log("     ");
      console.log("     ");
      console.log("     ");
      console.log("--" + joukkue.nimi + "--");
      for (let i of joukkueenRastit) {
          console.log(haeRastinKoodi(i));
      }
  }
  
  
  
  
  
  let piirretytReitit = [];
  
  // Piirtää joukkueen kulkeman reitin kartalle.
  function piirraReitti(joukkue) {
  
      let reitti = joukkueenReitti(joukkue);
  
      let vari = joukkue.style.getPropertyValue("background-color");
      let polyline = L.polyline(reitti, { color: vari }).addTo(mymap);
  
  
      piirretytReitit.push(polyline);
      return polyline;
  }
  
  function rainbow(numOfSteps, step) {
      // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
      // Adam Cole, 2011-Sept-14
      // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
      let r, g, b;
      let h = step / numOfSteps;
      let i = ~~(h * 6);
      let f = h * 6 - i;
      let q = 1 - f;
      switch (i % 6) {
          case 0: r = 1; g = f; b = 0; break;
          case 1: r = q; g = 1; b = 0; break;
          case 2: r = 0; g = 1; b = f; break;
          case 3: r = 0; g = q; b = 1; break;
          case 4: r = f; g = 0; b = 1; break;
          case 5: r = 1; g = 0; b = q; break;
      }
      let c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
      return (c);
  }
  
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
      let R = 6371; // Radius of the earth in km
      let dLat = deg2rad(lat2 - lat1);  // deg2rad below
      let dLon = deg2rad(lon2 - lon1);
      let a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
          ;
      let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      let d = R * c; // Distance in km
      return d;
  }
  
  function deg2rad(deg) {
      return deg * (Math.PI / 180);
  }