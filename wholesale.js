/* ============================================================
   ACHEL POS
   GROOTHANDEL + KLANTHANDTEKENING + BEWIJS
   V26
============================================================ */


const WHOLESALE_EMAIL =
  "fabiovenaruzzo@hotmail.com";


let wholesaleProducts =
  [];


const wholesaleQuantities =
  {};


const wholesaleDiscounts =
  {};


let wholesaleSubmitting =
  false;


let wholesaleSignatureHasInk =
  false;


let wholesaleSignatureDrawing =
  false;


let wholesaleSignatureLastPoint =
  null;


/* ============================================================
   MODULE START
============================================================ */

function initWholesaleModule() {

  injectWholesaleStyles();

  createWholesaleScreen();

}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initWholesaleModule
  );

}

else {

  initWholesaleModule();

}


setTimeout(
  initWholesaleModule,
  500
);


/* ============================================================
   HOOFDSCHERM
============================================================ */

function createWholesaleScreen() {

  if (
    document.getElementById(
      "wholesaleScreen"
    )
  ) {

    return;

  }


  const appMain =
    document.getElementById(
      "appMain"
    );


  if (
    !appMain
  ) {

    return;

  }


  const section =
    document.createElement(
      "section"
    );


  section.id =
    "wholesaleScreen";


  section.className =
    "hidden";


  section.innerHTML = `

    <button
      class="top-back"
      type="button"
      onclick="closeWholesaleOrder()"
    >
      ← Terug
    </button>


    <div class="card">

      <div class="wholesale-title">

        <span>
          EXTERNE BESTELLING
        </span>

        <h2>
          Bestelling groothandel
        </h2>

      </div>


      <p class="wholesale-intro">

        Stel de bestelling samen.
        De klant controleert en ondertekent
        de bestelling vóór verzending.

      </p>


      <label>
        Vertegenwoordiger
      </label>


      <div class="profile-box">

        <strong id="wholesaleRepName"></strong>

        <small id="wholesaleRepEmail"></small>

      </div>


      <label for="wholesaleReference">

        Referentie / klant

      </label>


      <input
        id="wholesaleReference"
        type="text"
        placeholder="Bijv. Café De Markt"
      >


      <label for="wholesaleDealerSelect">

        Drankenhandel / leveradres

      </label>


      <select
        id="wholesaleDealerSelect"
        onchange="toggleWholesaleDealerInput()"
      >

        <option value="">

          Kies drankenhandel

        </option>


        <option value="other">

          Andere / zelf invullen

        </option>

      </select>


      <div
        id="wholesaleDealerOtherBox"
        class="hidden"
      >

        <label for="wholesaleDealerOther">

          Drankenhandel / leveradres

        </label>


        <input
          id="wholesaleDealerOther"
          type="text"
          placeholder="Naam drankenhandel of leveradres"
        >

      </div>


      <label for="wholesaleNote">

        Opmerking

      </label>


      <textarea
        id="wholesaleNote"
        placeholder="Optionele informatie voor deze bestelling"
      ></textarea>

    </div>


    <div class="card">

      <h2>
        Bieren
      </h2>


      <div id="wholesaleProductsList">

        <div class="empty">

          Bieren laden...

        </div>

      </div>

    </div>


    <div class="sticky-action">

      <button
        id="wholesaleReviewButton"
        class="primary"
        type="button"
        onclick="showWholesaleSummary()"
      >

        Bestelling controleren

      </button>

    </div>

  `;


  appMain.appendChild(
    section
  );


  createWholesaleSummaryScreen();

}


/* ============================================================
   CONTROLE + HANDTEKENING SCHERM
============================================================ */

function createWholesaleSummaryScreen() {

  if (
    document.getElementById(
      "wholesaleSummaryScreen"
    )
  ) {

    return;

  }


  const appMain =
    document.getElementById(
      "appMain"
    );


  if (
    !appMain
  ) {

    return;

  }


  const section =
    document.createElement(
      "section"
    );


  section.id =
    "wholesaleSummaryScreen";


  section.className =
    "hidden";


  section.innerHTML = `

    <button
      class="top-back"
      type="button"
      onclick="backToWholesaleOrder()"
    >

      ← Terug aanpassen

    </button>


    <div
      id="wholesaleProofPreview"
      class="card wholesale-proof-preview"
    >

      <div class="wholesale-proof-header">

        <div>

          <span>
            ACHEL POS
          </span>

          <h2>
            Bestelbevestiging
          </h2>

        </div>


        <strong>
          CONCEPT
        </strong>

      </div>


      <div class="wholesale-proof-grid">

        <div>

          <span>
            Vertegenwoordiger
          </span>

          <strong id="wholesaleSummaryRep"></strong>

        </div>


        <div>

          <span>
            Referentie / klant
          </span>

          <strong id="wholesaleSummaryReference"></strong>

        </div>


        <div>

          <span>
            Drankenhandel
          </span>

          <strong id="wholesaleSummaryDealer"></strong>

        </div>

      </div>


      <div
        id="wholesaleSummaryProducts"
      ></div>


      <div
        id="wholesaleSummaryNoteBox"
        class="wholesale-proof-note hidden"
      >

        <span>
          Opmerking
        </span>

        <strong id="wholesaleSummaryNote"></strong>

      </div>


      <div class="wholesale-commercial-note">

        Eventuele gratis vaten zijn een
        commerciële tegemoetkoming.

        <strong>
          Voor gratis vaten enkel leeggoed factureren.
        </strong>

      </div>

    </div>


    <div class="card wholesale-signature-card">

      <div class="wholesale-signature-title">

        <span>
          KLANTGOEDKEURING
        </span>

        <h2>
          Ondertekening
        </h2>

      </div>


      <p>

        Door te ondertekenen bevestigt de klant
        de hierboven vermelde bestelling,
        aantallen en eventuele commerciële
        tegemoetkomingen.

      </p>


      <label for="wholesaleSignerName">

        Naam ondertekenaar

      </label>


      <input
        id="wholesaleSignerName"
        type="text"
        placeholder="Voornaam en achternaam klant"
        oninput="updateWholesaleSignatureState()"
      >


      <label>

        Handtekening

      </label>


      <div class="wholesale-signature-box">

        <canvas
          id="wholesaleSignatureCanvas"
        ></canvas>


        <div
          id="wholesaleSignaturePlaceholder"
          class="wholesale-signature-placeholder"
        >

          Teken hier met vinger of muis

        </div>

      </div>


      <button
        class="wholesale-clear-signature"
        type="button"
        onclick="clearWholesaleSignature()"
      >

        Handtekening wissen

      </button>


      <label class="wholesale-approval">

        <input
          id="wholesaleApprovalCheckbox"
          type="checkbox"
          onchange="updateWholesaleSignatureState()"
        >

        <span>

          Ik bevestig dat bovenstaande bestelling
          correct is en door de klant werd goedgekeurd.

        </span>

      </label>


      <div
        id="wholesaleSignatureStatus"
        class="wholesale-signature-status"
      >

        Nog niet ondertekend

      </div>


      <button
        id="wholesaleSubmitButton"
        class="primary"
        type="button"
        onclick="submitWholesaleOrder()"
        disabled
      >

        Ondertekenen & bestelling verzenden

      </button>

    </div>

  `;


  appMain.appendChild(
    section
  );

}


/* ============================================================
   OPEN NIEUWE BESTELLING
============================================================ */

async function openWholesaleOrder() {

  closeMenu();


  resetWholesaleOrder();


  document
    .getElementById(
      "wholesaleRepName"
    )
    .innerText =

      currentProfile?.naam ||
      "";


  document
    .getElementById(
      "wholesaleRepEmail"
    )
    .innerText =

      currentProfile?.email ||

      currentUser?.email ||

      "";


  await loadWholesaleProducts();


  showOnly(
    "wholesaleScreen"
  );

}


/* ============================================================
   TERUG
============================================================ */

function closeWholesaleOrder() {

  goHome();

}


function backToWholesaleOrder() {

  showOnly(
    "wholesaleScreen"
  );

}


/* ============================================================
   RESET BESTELLING
============================================================ */

function resetWholesaleOrder() {

  wholesaleSubmitting =
    false;


  wholesaleSignatureHasInk =
    false;


  wholesaleSignatureDrawing =
    false;


  wholesaleSignatureLastPoint =
    null;


  const reference =
    document.getElementById(
      "wholesaleReference"
    );


  const dealerSelect =
    document.getElementById(
      "wholesaleDealerSelect"
    );


  const dealerOther =
    document.getElementById(
      "wholesaleDealerOther"
    );


  const note =
    document.getElementById(
      "wholesaleNote"
    );


  const signer =
    document.getElementById(
      "wholesaleSignerName"
    );


  const approval =
    document.getElementById(
      "wholesaleApprovalCheckbox"
    );


  if (
    reference
  ) {

    reference.value =
      "";

  }


  if (
    dealerSelect
  ) {

    dealerSelect.value =
      "";

  }


  if (
    dealerOther
  ) {

    dealerOther.value =
      "";

  }


  if (
    note
  ) {

    note.value =
      "";

  }


  if (
    signer
  ) {

    signer.value =
      "";

  }


  if (
    approval
  ) {

    approval.checked =
      false;

  }


  document
    .getElementById(
      "wholesaleDealerOtherBox"
    )
    ?.classList
    .add(
      "hidden"
    );


  Object.keys(
    wholesaleQuantities
  )
    .forEach(
      productId => {

        wholesaleQuantities[
          productId
        ] =
          0;

      }
    );


  Object.keys(
    wholesaleDiscounts
  )
    .forEach(
      productId => {

        wholesaleDiscounts[
          productId
        ] =
          "geen";

      }
    );


  if (
    document.getElementById(
      "wholesaleSignatureCanvas"
    )
  ) {

    clearWholesaleSignature();

  }


  renderWholesaleProducts();

  updateWholesaleReviewButton();

}


/* ============================================================
   DRANKENHANDEL
============================================================ */

function toggleWholesaleDealerInput() {

  const value =
    document
      .getElementById(
        "wholesaleDealerSelect"
      )
      .value;


  document
    .getElementById(
      "wholesaleDealerOtherBox"
    )
    .classList
    .toggle(
      "hidden",
      value !==
      "other"
    );

}


function getWholesaleDealer() {

  const selectValue =
    document
      .getElementById(
        "wholesaleDealerSelect"
      )
      .value;


  if (
    selectValue ===
    "other"
  ) {

    return document
      .getElementById(
        "wholesaleDealerOther"
      )
      .value
      .trim();

  }


  return selectValue;

}


/* ============================================================
   PRODUCTEN LADEN
============================================================ */

async function loadWholesaleProducts() {

  const container =
    document
      .getElementById(
        "wholesaleProductsList"
      );


  if (
    !container
  ) {

    return;

  }


  container.innerHTML = `

    <div class="empty">

      Bieren laden...

    </div>

  `;


  const {
    data,
    error
  } =
    await supabaseClient

      .from(
        "products"
      )

      .select(
        "id, naam, categorie, eenheid, sort_order"
      )

      .eq(
        "actief",
        true
      )

      .eq(
        "categorie",
        "bier"
      )

      .order(
        "sort_order",
        {
          ascending:
            true
        }
      );


  if (
    error
  ) {

    container.innerHTML = `

      <div class="info error">

        Bieren konden niet worden geladen:

        ${wholesaleEscapeHtml(
          error.message
        )}

      </div>

    `;


    return;

  }


  wholesaleProducts =
    data ||
    [];


  wholesaleProducts
    .forEach(
      product => {

        if (
          wholesaleQuantities[
            product.id
          ] ===
          undefined
        ) {

          wholesaleQuantities[
            product.id
          ] =
            0;

        }


        if (
          wholesaleDiscounts[
            product.id
          ] ===
          undefined
        ) {

          wholesaleDiscounts[
            product.id
          ] =
            "geen";

        }

      }
    );


  renderWholesaleProducts();

}


/* ============================================================
   PRODUCTEN TONEN
============================================================ */

function renderWholesaleProducts() {

  const container =
    document
      .getElementById(
        "wholesaleProductsList"
      );


  if (
    !container
  ) {

    return;

  }


  if (
    !wholesaleProducts.length
  ) {

    container.innerHTML = `

      <div class="empty">

        Geen bierproducten gevonden.

      </div>

    `;


    return;

  }


  container.innerHTML =

    wholesaleProducts

      .map(
        product => {

          const isKeg =
            isWholesaleKeg(
              product
            );


          const calculation =
            calculateWholesaleProduct(
              product
            );


          return `

            <div class="wholesale-product">

              <div class="wholesale-product-head">

                <div>

                  <strong>

                    ${wholesaleEscapeHtml(
                      product.naam
                    )}

                  </strong>


                  <span>

                    ${wholesaleEscapeHtml(
                      product.eenheid ||
                      ""
                    )}

                  </span>

                </div>


                <div class="qty">

                  <button
                    type="button"
                    onclick="changeWholesaleQty('${product.id}', -1)"
                  >

                    −

                  </button>


                  <span
                    id="wholesaleQty-${product.id}"
                  >

                    ${
                      wholesaleQuantities[
                        product.id
                      ] ||
                      0
                    }

                  </span>


                  <button
                    type="button"
                    onclick="changeWholesaleQty('${product.id}', 1)"
                  >

                    +

                  </button>

                </div>

              </div>


              ${
                isKeg

                  ? `

                      <label
                        for="wholesaleDiscount-${product.id}"
                      >

                        Commerciële tegemoetkoming

                      </label>


                      <select
                        id="wholesaleDiscount-${product.id}"
                        onchange="changeWholesaleDiscount('${product.id}', this.value)"
                      >

                        <option
                          value="geen"
                          ${
                            wholesaleDiscounts[
                              product.id
                            ] ===
                            "geen"

                              ? "selected"

                              : ""
                          }
                        >

                          Geen

                        </option>


                        <option
                          value="5+1"
                          ${
                            wholesaleDiscounts[
                              product.id
                            ] ===
                            "5+1"

                              ? "selected"

                              : ""
                          }
                        >

                          5 + 1

                        </option>


                        <option
                          value="10+2"
                          ${
                            wholesaleDiscounts[
                              product.id
                            ] ===
                            "10+2"

                              ? "selected"

                              : ""
                          }
                        >

                          10 + 2

                        </option>

                      </select>


                      <div
                        id="wholesaleCalc-${product.id}"
                        class="info ${
                          calculation.free >
                          0

                            ? "ok"

                            : ""
                        }"
                      >

                        ${buildWholesaleCalculationText(
                          calculation
                        )}

                      </div>

                    `

                  : ""
              }

            </div>

          `;

        }
      )

      .join("");


  updateWholesaleReviewButton();

}


/* ============================================================
   VAT HERKENNEN
============================================================ */

function isWholesaleKeg(
  product
) {

  const unit =
    String(
      product.eenheid ||
      ""
    )
      .toLowerCase();


  const name =
    String(
      product.naam ||
      ""
    )
      .toLowerCase();


  return (

    unit.includes(
      "vat"
    )

    ||

    name.includes(
      "20l"
    )

    ||

    name.includes(
      "20 l"
    )

  );

}


/* ============================================================
   AANTAL
============================================================ */

function changeWholesaleQty(
  productId,
  amount
) {

  wholesaleQuantities[
    productId
  ] =

    Math.max(

      0,

      (
        wholesaleQuantities[
          productId
        ] ||
        0
      )

      +

      amount

    );


  const element =
    document
      .getElementById(
        `wholesaleQty-${productId}`
      );


  if (
    element
  ) {

    element.innerText =
      wholesaleQuantities[
        productId
      ];

  }


  updateWholesaleCalculation(
    productId
  );


  updateWholesaleReviewButton();

}


/* ============================================================
   KORTING
============================================================ */

function changeWholesaleDiscount(
  productId,
  discount
) {

  wholesaleDiscounts[
    productId
  ] =
    discount;


  updateWholesaleCalculation(
    productId
  );

}


/* ============================================================
   KORTING BEREKENING
============================================================ */

function calculateWholesaleProduct(
  product
) {

  const paid =
    Number(
      wholesaleQuantities[
        product.id
      ] ||
      0
    );


  const discount =

    isWholesaleKeg(
      product
    )

      ? (
          wholesaleDiscounts[
            product.id
          ] ||
          "geen"
        )

      : "geen";


  let free =
    0;


  if (
    discount ===
    "5+1"
  ) {

    free =
      Math.floor(
        paid /
        5
      );

  }


  if (
    discount ===
    "10+2"
  ) {

    free =

      Math.floor(
        paid /
        10
      )

      *

      2;

  }


  return {

    paid:
      paid,

    discount:
      discount,

    free:
      free,

    total:
      paid +
      free

  };

}


/* ============================================================
   KORTING TEKST
============================================================ */

function buildWholesaleCalculationText(
  calculation
) {

  if (
    calculation.discount ===
    "geen"
  ) {

    return (

      `Te leveren: ${calculation.paid} vat(en)`

    );

  }


  if (
    calculation.free ===
    0
  ) {

    return (

      `Actie ${calculation.discount} geselecteerd. `

      +

      `Het ingegeven aantal geeft nog geen gratis vat.`

    );

  }


  return (

    `${calculation.paid} betaald + `

    +

    `${calculation.free} gratis = `

    +

    `${calculation.total} totaal te leveren. `

    +

    `Voor gratis vat(en) enkel leeggoed factureren.`

  );

}


/* ============================================================
   KORTING BIJWERKEN
============================================================ */

function updateWholesaleCalculation(
  productId
) {

  const product =
    wholesaleProducts
      .find(
        item =>
          String(
            item.id
          ) ===
          String(
            productId
          )
      );


  if (
    !product ||
    !isWholesaleKeg(
      product
    )
  ) {

    return;

  }


  const calculation =
    calculateWholesaleProduct(
      product
    );


  const element =
    document
      .getElementById(
        `wholesaleCalc-${productId}`
      );


  if (
    !element
  ) {

    return;

  }


  element.className =

    calculation.free >
    0

      ? "info ok"

      : "info";


  element.innerText =
    buildWholesaleCalculationText(
      calculation
    );

}


/* ============================================================
   GESELECTEERDE PRODUCTEN
============================================================ */

function getSelectedWholesaleProducts() {

  return wholesaleProducts

    .filter(
      product =>

        (
          wholesaleQuantities[
            product.id
          ] ||
          0
        )

        >

        0
    )

    .map(
      product => {

        const calculation =
          calculateWholesaleProduct(
            product
          );


        return {

          id:
            product.id,

          naam:
            product.naam,

          eenheid:
            product.eenheid ||
            "",

          paid:
            calculation.paid,

          discount:
            calculation.discount,

          free:
            calculation.free,

          total:
            calculation.total

        };

      }
    );

}


/* ============================================================
   REVIEW KNOP
============================================================ */

function updateWholesaleReviewButton() {

  const button =
    document
      .getElementById(
        "wholesaleReviewButton"
      );


  if (
    !button
  ) {

    return;

  }


  const total =
    getSelectedWholesaleProducts()

      .reduce(
        (
          sum,
          product
        ) =>

          sum +
          product.total,

        0
      );


  button.innerText =

    total >
    0

      ? `Bestelling controleren · ${total}`

      : "Bestelling controleren";

}


/* ============================================================
   CONTROLE SCHERM
============================================================ */

function showWholesaleSummary() {

  const reference =
    document
      .getElementById(
        "wholesaleReference"
      )
      .value
      .trim();


  const dealer =
    getWholesaleDealer();


  const note =
    document
      .getElementById(
        "wholesaleNote"
      )
      .value
      .trim();


  const products =
    getSelectedWholesaleProducts();


  if (
    !reference
  ) {

    alert(
      "Vul een referentie of klantnaam in."
    );

    return;

  }


  if (
    !dealer
  ) {

    alert(
      "Vul de drankenhandel of het leveradres in."
    );

    return;

  }


  if (
    !products.length
  ) {

    alert(
      "Selecteer minstens één bier."
    );

    return;

  }


  document
    .getElementById(
      "wholesaleSummaryRep"
    )
    .innerText =

      currentProfile?.naam ||
      "";


  document
    .getElementById(
      "wholesaleSummaryReference"
    )
    .innerText =
      reference;


  document
    .getElementById(
      "wholesaleSummaryDealer"
    )
    .innerText =
      dealer;


  document
    .getElementById(
      "wholesaleSummaryProducts"
    )
    .innerHTML =

      products
        .map(
          buildWholesaleSummaryProduct
        )
        .join("");


  const noteBox =
    document
      .getElementById(
        "wholesaleSummaryNoteBox"
      );


  const noteElement =
    document
      .getElementById(
        "wholesaleSummaryNote"
      );


  if (
    note
  ) {

    noteElement.innerText =
      note;


    noteBox.classList
      .remove(
        "hidden"
      );

  }

  else {

    noteElement.innerText =
      "";


    noteBox.classList
      .add(
        "hidden"
      );

  }


  showOnly(
    "wholesaleSummaryScreen"
  );


  setTimeout(
    () => {

      setupWholesaleSignatureCanvas();

      clearWholesaleSignature();

      updateWholesaleSignatureState();

    },
    80
  );

}


/* ============================================================
   PRODUCT OP CONTROLEPAGINA
============================================================ */

function buildWholesaleSummaryProduct(
  product
) {

  return `

    <div class="wholesale-summary-product">

      <strong>

        ${wholesaleEscapeHtml(
          product.naam
        )}

      </strong>


      <div class="summary-line">

        <span>

          ${
            isWholesaleKeg(
              product
            )

              ? "Betaalde vaten"

              : "Aantal"
          }

        </span>


        <strong>
          ${product.paid}
        </strong>

      </div>


      ${
        product.discount !==
        "geen"

          ? `

              <div class="summary-line">

                <span>
                  Actie
                </span>

                <strong>
                  ${product.discount}
                </strong>

              </div>


              <div class="summary-line">

                <span>
                  Gratis
                </span>

                <strong>
                  ${product.free}
                </strong>

              </div>


              <div class="summary-line">

                <span>
                  Totaal te leveren
                </span>

                <strong>
                  ${product.total}
                </strong>

              </div>

            `

          : ""
      }

    </div>

  `;

}


/* ============================================================
   SIGNATURE CANVAS
============================================================ */

function setupWholesaleSignatureCanvas() {

  const canvas =
    document
      .getElementById(
        "wholesaleSignatureCanvas"
      );


  if (
    !canvas
  ) {

    return;

  }


  resizeWholesaleSignatureCanvas();


  if (
    canvas.dataset.ready ===
    "1"
  ) {

    return;

  }


  canvas.dataset.ready =
    "1";


  canvas.style.touchAction =
    "none";


  canvas.addEventListener(
    "pointerdown",
    startWholesaleSignature
  );


  canvas.addEventListener(
    "pointermove",
    drawWholesaleSignature
  );


  canvas.addEventListener(
    "pointerup",
    endWholesaleSignature
  );


  canvas.addEventListener(
    "pointercancel",
    endWholesaleSignature
  );


  canvas.addEventListener(
    "pointerleave",
    event => {

      if (
        wholesaleSignatureDrawing
      ) {

        endWholesaleSignature(
          event
        );

      }

    }
  );

}


/* ============================================================
   CANVAS RESIZE
============================================================ */

function resizeWholesaleSignatureCanvas() {

  const canvas =
    document
      .getElementById(
        "wholesaleSignatureCanvas"
      );


  if (
    !canvas
  ) {

    return;

  }


  const rect =
    canvas.getBoundingClientRect();


  const ratio =
    Math.max(
      1,
      window.devicePixelRatio ||
      1
    );


  canvas.width =
    Math.round(
      rect.width *
      ratio
    );


  canvas.height =
    Math.round(
      rect.height *
      ratio
    );


  const context =
    canvas.getContext(
      "2d"
    );


  context.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );


  context.lineWidth =
    2.2;


  context.lineCap =
    "round";


  context.lineJoin =
    "round";


  context.strokeStyle =
    "#182019";

}


/* ============================================================
   SIGNATURE POINT
============================================================ */

function getWholesaleSignaturePoint(
  event
) {

  const canvas =
    document
      .getElementById(
        "wholesaleSignatureCanvas"
      );


  const rect =
    canvas.getBoundingClientRect();


  return {

    x:
      event.clientX -
      rect.left,

    y:
      event.clientY -
      rect.top

  };

}


/* ============================================================
   START TEKENEN
============================================================ */

function startWholesaleSignature(
  event
) {

  event.preventDefault();


  const canvas =
    event.currentTarget;


  canvas.setPointerCapture?.(
    event.pointerId
  );


  wholesaleSignatureDrawing =
    true;


  wholesaleSignatureLastPoint =
    getWholesaleSignaturePoint(
      event
    );


  const context =
    canvas.getContext(
      "2d"
    );


  context.beginPath();


  context.arc(

    wholesaleSignatureLastPoint.x,

    wholesaleSignatureLastPoint.y,

    1.1,

    0,

    Math.PI *
    2

  );


  context.fillStyle =
    "#182019";


  context.fill();


  wholesaleSignatureHasInk =
    true;


  updateWholesaleSignatureState();

}


/* ============================================================
   TEKENEN
============================================================ */

function drawWholesaleSignature(
  event
) {

  if (
    !wholesaleSignatureDrawing
  ) {

    return;

  }


  event.preventDefault();


  const canvas =
    event.currentTarget;


  const point =
    getWholesaleSignaturePoint(
      event
    );


  const context =
    canvas.getContext(
      "2d"
    );


  context.beginPath();


  context.moveTo(

    wholesaleSignatureLastPoint.x,

    wholesaleSignatureLastPoint.y

  );


  context.lineTo(

    point.x,

    point.y

  );


  context.stroke();


  wholesaleSignatureLastPoint =
    point;


  wholesaleSignatureHasInk =
    true;


  updateWholesaleSignatureState();

}


/* ============================================================
   STOP TEKENEN
============================================================ */

function endWholesaleSignature(
  event
) {

  wholesaleSignatureDrawing =
    false;


  wholesaleSignatureLastPoint =
    null;


  try {

    event.currentTarget
      ?.releasePointerCapture?.(
        event.pointerId
      );

  }

  catch (
    error
  ) {

    /* Geen actie nodig */

  }

}


/* ============================================================
   HANDTEKENING WISSEN
============================================================ */

function clearWholesaleSignature() {

  const canvas =
    document
      .getElementById(
        "wholesaleSignatureCanvas"
      );


  if (
    canvas
  ) {

    const context =
      canvas.getContext(
        "2d"
      );


    context.clearRect(

      0,

      0,

      canvas.width,

      canvas.height

    );

  }


  wholesaleSignatureHasInk =
    false;


  wholesaleSignatureDrawing =
    false;


  wholesaleSignatureLastPoint =
    null;


  updateWholesaleSignatureState();

}


/* ============================================================
   SIGNATURE STATUS
============================================================ */

function updateWholesaleSignatureState() {

  const signer =
    document
      .getElementById(
        "wholesaleSignerName"
      )
      ?.value
      .trim()

    ||

    "";


  const approved =
    Boolean(

      document
        .getElementById(
          "wholesaleApprovalCheckbox"
        )
        ?.checked

    );


  const complete =

    signer.length >=
    2

    &&

    wholesaleSignatureHasInk

    &&

    approved;


  const placeholder =
    document
      .getElementById(
        "wholesaleSignaturePlaceholder"
      );


  if (
    placeholder
  ) {

    placeholder.classList.toggle(

      "hidden",

      wholesaleSignatureHasInk

    );

  }


  const status =
    document
      .getElementById(
        "wholesaleSignatureStatus"
      );


  if (
    status
  ) {

    status.className =

      complete

        ? "wholesale-signature-status signed"

        : "wholesale-signature-status";


    status.innerText =

      complete

        ? "✓ Klantgoedkeuring compleet"

        : "Nog niet volledig ondertekend";

  }


  const button =
    document
      .getElementById(
        "wholesaleSubmitButton"
      );


  if (
    button
  ) {

    button.disabled =
      !complete ||
      wholesaleSubmitting;

  }

}


/* ============================================================
   HANDTEKENING DATA
============================================================ */

function getWholesaleSignatureData() {

  const canvas =
    document
      .getElementById(
        "wholesaleSignatureCanvas"
      );


  if (
    !canvas ||
    !wholesaleSignatureHasInk
  ) {

    return "";

  }


  return canvas.toDataURL(
    "image/png"
  );

}


/* ============================================================
   SNAPSHOT
============================================================ */

function createWholesaleSnapshot(
  reference,
  dealer,
  note,
  products,
  signerName
) {

  return {

    document_type:
      "achel_wholesale_order_confirmation",

    document_version:
      1,

    reference:
      reference,

    dealer:
      dealer,

    note:
      note ||
      "",

    representative: {

      id:
        currentUser?.id ||
        "",

      name:
        currentProfile?.naam ||
        "",

      email:

        currentProfile?.email ||

        currentUser?.email ||

        ""

    },

    signer: {

      name:
        signerName

    },

    products:

      products.map(
        product => ({

          product_id:
            String(
              product.id
            ),

          name:
            product.naam,

          unit:
            product.eenheid ||
            "",

          paid:
            product.paid,

          discount:
            product.discount,

          free:
            product.free,

          total:
            product.total

        })
      ),

    commercial_terms: {

      free_keg_text:
        "Gratis vat(en) zijn commerciële tegemoetkoming. Enkel leeggoed factureren voor de gratis vaten."

    },

    client_signed_at:
      new Date()
        .toISOString()

  };

}


/* ============================================================
   SHA-256
============================================================ */

async function createWholesaleProofHash(
  snapshot,
  signatureData
) {

  const source =
    JSON.stringify(
      snapshot
    )

    +

    "|"

    +

    signatureData;


  const bytes =
    new TextEncoder()
      .encode(
        source
      );


  const digest =
    await crypto.subtle
      .digest(
        "SHA-256",
        bytes
      );


  return Array
    .from(
      new Uint8Array(
        digest
      )
    )
    .map(
      byte =>
        byte
          .toString(
            16
          )
          .padStart(
            2,
            "0"
          )
    )
    .join("");

}


/* ============================================================
   BESTELLING DEFINITIEF OPSLAAN
============================================================ */

async function submitWholesaleOrder() {

  if (
    wholesaleSubmitting
  ) {

    return;

  }


  const products =
    getSelectedWholesaleProducts();


  const reference =
    document
      .getElementById(
        "wholesaleReference"
      )
      .value
      .trim();


  const dealer =
    getWholesaleDealer();


  const note =
    document
      .getElementById(
        "wholesaleNote"
      )
      .value
      .trim();


  const signerName =
    document
      .getElementById(
        "wholesaleSignerName"
      )
      .value
      .trim();


  const approved =
    document
      .getElementById(
        "wholesaleApprovalCheckbox"
      )
      .checked;


  const signatureData =
    getWholesaleSignatureData();


  if (
    !reference
  ) {

    alert(
      "Referentie / klant ontbreekt."
    );

    return;

  }


  if (
    !dealer
  ) {

    alert(
      "Drankenhandel ontbreekt."
    );

    return;

  }


  if (
    !products.length
  ) {

    alert(
      "Er staan geen producten in de bestelling."
    );

    return;

  }


  if (
    signerName.length <
    2
  ) {

    alert(
      "Vul de naam van de klant die ondertekent in."
    );

    return;

  }


  if (
    !signatureData
  ) {

    alert(
      "Laat de klant eerst ondertekenen."
    );

    return;

  }


  if (
    !approved
  ) {

    alert(
      "Bevestig eerst dat de bestelling door de klant werd goedgekeurd."
    );

    return;

  }


  const snapshot =
    createWholesaleSnapshot(

      reference,

      dealer,

      note,

      products,

      signerName

    );


  let proofHash =
    "";


  try {

    proofHash =
      await createWholesaleProofHash(

        snapshot,

        signatureData

      );

  }

  catch (
    error
  ) {

    console.error(
      "HASH FOUT:",
      error
    );


    alert(
      "Het bewijsdocument kon niet veilig worden voorbereid."
    );

    return;

  }


  const items =
    products
      .map(
        product => ({

          product_id:
            product.id,

          product_naam:
            product.naam,

          eenheid:
            product.eenheid ||
            "",

          betaald_aantal:
            product.paid,

          actie:
            product.discount,

          gratis_aantal:
            product.free,

          totaal_aantal:
            product.total

        })
      );


  const button =
    document
      .getElementById(
        "wholesaleSubmitButton"
      );


  wholesaleSubmitting =
    true;


  button.disabled =
    true;


  button.innerText =
    "Ondertekende bestelling opslaan...";


  const {
    data: orderId,
    error
  } =
    await supabaseClient

      .rpc(
        "create_signed_wholesale_order",
        {

          p_referentie:
            reference,

          p_drankenhandel:
            dealer,

          p_opmerking:
            note ||
            null,

          p_items:
            items,

          p_signer_name:
            signerName,

          p_signature_data:
            signatureData,

          p_snapshot:
            snapshot,

          p_proof_hash:
            proofHash

        }
      );


  if (
    error ||
    !orderId
  ) {

    console.error(
      "SIGNED WHOLESALE ERROR:",
      error
    );


    wholesaleSubmitting =
      false;


    button.disabled =
      false;


    button.innerText =
      "Ondertekenen & bestelling verzenden";


    alert(

      "De ondertekende bestelling kon niet worden opgeslagen.\n\n"

      +

      (
        error?.message ||
        "Onbekende fout"
      )

    );


    return;

  }


  const orderReference =
    createWholesaleReference(
      orderId
    );


  button.innerText =
    "✓ Bestelling ondertekend";


  /*
    E-mail pas openen NADAT:
    - order bestaat
    - bestelregels bestaan
    - bewijs bestaat
    - handtekening bestaat
  */

  openWholesaleEmail(

    orderReference,

    reference,

    dealer,

    note,

    products,

    signerName

  );


  setTimeout(
    () => {

      alert(

        "De bestelling is ondertekend en veilig opgeslagen.\n\n"

        +

        `Bestelnummer: ${orderReference}\n`

        +

        `Ondertekend door: ${signerName}\n\n`

        +

        "Het bewijs kan later opnieuw als PDF worden geopend vanuit Beheer."

      );


      resetWholesaleOrder();


      wholesaleSubmitting =
        false;


      goHome();

    },
    650
  );

}


/* ============================================================
   REFERENTIENUMMER
============================================================ */

function createWholesaleReference(
  id
) {

  return (

    `GH-${new Date().getFullYear()}-${String(
      id
    )
      .slice(
        0,
        8
      )
      .toUpperCase()}`

  );

}


/* ============================================================
   E-MAIL
============================================================ */

function openWholesaleEmail(
  orderNumber,
  reference,
  dealer,
  note,
  products,
  signerName
) {

  let orderText =
    "";


  products
    .forEach(
      product => {

        orderText +=

`${product.naam}
--------------------
`;


        if (
          isWholesaleKeg(
            product
          )
        ) {

          orderText +=
`Betaalde vaten: ${product.paid}
`;


          if (
            product.discount !==
            "geen"
          ) {

            orderText +=
`Actie: ${product.discount}
Gratis vaten: ${product.free}
Totaal te leveren: ${product.total}
`;


            if (
              product.free >
              0
            ) {

              orderText +=
`Gratis vat(en) zijn commerciële tegemoetkoming.
Enkel leeggoed factureren voor de gratis vaten.
`;

            }

          }

        }

        else {

          orderText +=
`Aantal: ${product.paid}
`;

        }


        orderText +=
          "\n";

      }
    );


  const subject =

    `Bestelling groothandel ${orderNumber} - ${reference}`;


  const body =

`ACHEL - BESTELLING GROOTHANDEL

Bestelnummer:
${orderNumber}

Vertegenwoordiger:
${currentProfile?.naam || ""}

E-mail:
${currentProfile?.email || currentUser?.email || ""}

Referentie / klant:
${reference}

Drankenhandel / levering:
${dealer}

KLANTGOEDKEURING
====================
Ondertekend door:
${signerName}

De ondertekende bestelbevestiging is centraal opgeslagen in Achel POS.

BESTELLING
====================

${orderText}

OPMERKING
====================
${note || "Geen opmerkingen"}

Deze bestelling werd vóór verzending door de klant ondertekend.`;


  const mailto =

    `mailto:${WHOLESALE_EMAIL}`

    +

    `?subject=${encodeURIComponent(
      subject
    )}`

    +

    `&body=${encodeURIComponent(
      body
    )}`;


  setTimeout(
    () => {

      window.location.href =
        mailto;

    },
    250
  );

}


/* ============================================================
   BEWIJS OPHALEN
============================================================ */

async function getWholesaleProof(
  orderId
) {

  const {
    data,
    error
  } =
    await supabaseClient

      .from(
        "wholesale_order_proofs"
      )

      .select(
        "order_id, user_id, signer_name, signed_at, snapshot, signature_data, proof_hash, created_at"
      )

      .eq(
        "order_id",
        orderId
      )

      .maybeSingle();


  if (
    error
  ) {

    throw error;

  }


  return data;

}


/* ============================================================
   PDF VAN BEWIJS
============================================================ */

async function downloadWholesaleProofPdf(
  orderId
) {

  try {

    const proof =
      await getWholesaleProof(
        orderId
      );


    if (
      !proof
    ) {

      alert(
        "Voor deze oude bestelling is geen ondertekend bewijs beschikbaar."
      );

      return;

    }


    if (
      !window.jspdf?.jsPDF
    ) {

      alert(
        "PDF-module is niet geladen."
      );

      return;

    }


    const {
      jsPDF
    } =
      window.jspdf;


    const documentPdf =
      new jsPDF({

        orientation:
          "portrait",

        unit:
          "mm",

        format:
          "a4"

      });


    const snapshot =
      proof.snapshot ||
      {};


    const products =
      Array.isArray(
        snapshot.products
      )

        ? snapshot.products

        : [];


    const margin =
      16;


    const pageWidth =
      210;


    const contentWidth =
      pageWidth -
      margin * 2;


    let y =
      18;


/* ============================================================
   PDF HELPERS
============================================================ */

    function ensureSpace(
      needed
    ) {

      if (
        y +
        needed >
        280
      ) {

        documentPdf.addPage();

        y =
          18;

      }

    }


    function line(
      label,
      value
    ) {

      ensureSpace(
        12
      );


      documentPdf
        .setFont(
          "helvetica",
          "bold"
        );


      documentPdf
        .setFontSize(
          9
        );


      documentPdf.text(
        label,
        margin,
        y
      );


      documentPdf
        .setFont(
          "helvetica",
          "normal"
        );


      const text =
        documentPdf.splitTextToSize(

          String(
            value ||
            "-"
          ),

          118

        );


      documentPdf.text(
        text,
        76,
        y
      );


      y +=
        Math.max(
          7,
          text.length *
          5
        );

    }


/* ============================================================
   PDF HEADER
============================================================ */

    documentPdf
      .setFont(
        "helvetica",
        "bold"
      );


    documentPdf
      .setFontSize(
        20
      );


    documentPdf.text(
      "ACHEL",
      margin,
      y
    );


    documentPdf
      .setFontSize(
        9
      );


    documentPdf
      .setFont(
        "helvetica",
        "normal"
      );


    documentPdf.text(
      "Achel POS - Ondertekende bestelbevestiging",
      margin,
      y +
      6
    );


    documentPdf
      .setDrawColor(
        140,
        105,
        47
      );


    documentPdf
      .setLineWidth(
        0.7
      );


    documentPdf.line(
      margin,
      y +
      10,
      pageWidth -
      margin,
      y +
      10
    );


    y +=
      20;


/* ============================================================
   ORDER INFO
============================================================ */

    documentPdf
      .setFont(
        "helvetica",
        "bold"
      );


    documentPdf
      .setFontSize(
        14
      );


    documentPdf.text(
      "Bestelbevestiging",
      margin,
      y
    );


    y +=
      10;


    line(
      "Bestelnummer",
      createWholesaleReference(
        orderId
      )
    );


    line(
      "Referentie / klant",
      snapshot.reference
    );


    line(
      "Drankenhandel",
      snapshot.dealer
    );


    line(
      "Vertegenwoordiger",
      snapshot.representative?.name
    );


    line(
      "E-mail",
      snapshot.representative?.email
    );


    line(
      "Ondertekend door",
      proof.signer_name
    );


    line(

      "Datum / tijd",

      new Date(
        proof.signed_at
      )
        .toLocaleString(
          "nl-BE"
        )

    );


/* ============================================================
   PRODUCTEN
============================================================ */

    y +=
      4;


    ensureSpace(
      18
    );


    documentPdf
      .setFont(
        "helvetica",
        "bold"
      );


    documentPdf
      .setFontSize(
        13
      );


    documentPdf.text(
      "Bestelling",
      margin,
      y
    );


    y +=
      8;


    products
      .forEach(
        product => {

          ensureSpace(
            24
          );


          documentPdf
            .setFont(
              "helvetica",
              "bold"
            );


          documentPdf
            .setFontSize(
              10
            );


          documentPdf.text(

            String(
              product.name ||
              ""
            ),

            margin,

            y

          );


          y +=
            5;


          documentPdf
            .setFont(
              "helvetica",
              "normal"
            );


          documentPdf
            .setFontSize(
              9
            );


          documentPdf.text(

            `Betaald/aantal: ${product.paid}`,

            margin +
            3,

            y

          );


          y +=
            5;


          if (
            product.discount &&
            product.discount !==
            "geen"
          ) {

            documentPdf.text(

              `Actie: ${product.discount}`,

              margin +
              3,

              y

            );


            y +=
              5;


            documentPdf.text(

              `Gratis: ${product.free} | Totaal te leveren: ${product.total}`,

              margin +
              3,

              y

            );


            y +=
              5;

          }


          y +=
            3;

        }
      );


/* ============================================================
   OPMERKING
============================================================ */

    if (
      snapshot.note
    ) {

      ensureSpace(
        25
      );


      documentPdf
        .setFont(
          "helvetica",
          "bold"
        );


      documentPdf.text(
        "Opmerking",
        margin,
        y
      );


      y +=
        6;


      documentPdf
        .setFont(
          "helvetica",
          "normal"
        );


      const noteLines =
        documentPdf.splitTextToSize(

          snapshot.note,

          contentWidth

        );


      documentPdf.text(
        noteLines,
        margin,
        y
      );


      y +=
        noteLines.length *
        5 +
        5;

    }


/* ============================================================
   COMMERCIELE TEGEMOETKOMING
============================================================ */

    ensureSpace(
      24
    );


    documentPdf
      .setFont(
        "helvetica",
        "bold"
      );


    documentPdf
      .setFontSize(
        9
      );


    documentPdf.text(
      "Commerciële tegemoetkoming",
      margin,
      y
    );


    y +=
      5;


    documentPdf
      .setFont(
        "helvetica",
        "normal"
      );


    const termLines =
      documentPdf.splitTextToSize(

        snapshot
          .commercial_terms
          ?.free_keg_text

        ||

        "Gratis vat(en) zijn commerciële tegemoetkoming. Enkel leeggoed factureren voor de gratis vaten.",

        contentWidth

      );


    documentPdf.text(
      termLines,
      margin,
      y
    );


    y +=
      termLines.length *
      5 +
      7;


/* ============================================================
   HANDTEKENING
============================================================ */

    ensureSpace(
      55
    );


    documentPdf
      .setFont(
        "helvetica",
        "bold"
      );


    documentPdf
      .setFontSize(
        12
      );


    documentPdf.text(
      "Klantgoedkeuring",
      margin,
      y
    );


    y +=
      7;


    documentPdf
      .setDrawColor(
        190,
        190,
        190
      );


    documentPdf.rect(
      margin,
      y,
      90,
      35
    );


    try {

      documentPdf.addImage(

        proof.signature_data,

        "PNG",

        margin +
        3,

        y +
        3,

        84,

        29

      );

    }

    catch (
      error
    ) {

      console.warn(
        "Handtekening kon niet in PDF worden geplaatst:",
        error
      );

    }


    documentPdf
      .setFont(
        "helvetica",
        "normal"
      );


    documentPdf
      .setFontSize(
        9
      );


    documentPdf.text(

      `Ondertekend door: ${proof.signer_name}`,

      112,

      y +
      8

    );


    documentPdf.text(

      new Date(
        proof.signed_at
      )
        .toLocaleString(
          "nl-BE"
        ),

      112,

      y +
      15

    );


    y +=
      45;


/* ============================================================
   HASH
============================================================ */

    ensureSpace(
      18
    );


    documentPdf
      .setFontSize(
        7
      );


    documentPdf
      .setTextColor(
        110,
        110,
        110
      );


    const hashLines =
      documentPdf.splitTextToSize(

        `Controlehash SHA-256: ${proof.proof_hash}`,

        contentWidth

      );


    documentPdf.text(
      hashLines,
      margin,
      y
    );


    y +=
      hashLines.length *
      4;


/* ============================================================
   FOOTER
============================================================ */

    documentPdf
      .setFontSize(
        7
      );


    documentPdf.text(

      "Dit document werd gegenereerd uit het onveranderbare bestelbewijs in Achel POS.",

      margin,

      289

    );


/* ============================================================
   SAVE
============================================================ */

    documentPdf.save(

      `${createWholesaleReference(orderId)}_${safeWholesaleFilename(snapshot.reference)}.pdf`

    );

  }

  catch (
    error
  ) {

    console.error(
      "PDF FOUT:",
      error
    );


    alert(

      "Het bewijs kon niet als PDF worden geopend.\n\n"

      +

      (
        error?.message ||
        "Onbekende fout"
      )

    );

  }

}


/* ============================================================
   SAFE FILE NAME
============================================================ */

function safeWholesaleFilename(
  value
) {

  return String(
    value ||
    "bestelling"
  )

    .replace(
      /[^a-z0-9_-]/gi,
      "_"
    )

    .slice(
      0,
      60
    );

}


/* ============================================================
   HTML ESCAPE
============================================================ */

function wholesaleEscapeHtml(
  value
) {

  return String(
    value ??
    ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* ============================================================
   STYLING
============================================================ */

function injectWholesaleStyles() {

  if (
    document.getElementById(
      "achelWholesaleStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "achelWholesaleStyles";


  style.textContent = `

    .wholesale-title span,
    .wholesale-signature-title span {

      display:block;

      color:var(--gold);

      font-size:9px;

      font-weight:900;

      letter-spacing:.08em;

    }


    .wholesale-title h2,
    .wholesale-signature-title h2 {

      margin:
        2px 0 0;

    }


    .wholesale-intro {

      margin:
        6px 0 0;

      color:var(--muted);

      font-size:12px;

      line-height:1.4;

    }


    .wholesale-product {

      border:
        1px solid
        var(--border);

      border-radius:
        13px;

      padding:11px;

      margin-bottom:
        7px;

      background:white;

    }


    .wholesale-product-head {

      display:flex;

      align-items:center;

      justify-content:
        space-between;

      gap:10px;

    }


    .wholesale-product-head
    > div:first-child
    > strong {

      display:block;

      font-size:14px;

    }


    .wholesale-product-head
    > div:first-child
    > span {

      display:block;

      margin-top:2px;

      color:var(--muted);

      font-size:9px;

    }


    .wholesale-proof-preview {

      border-top:
        5px solid
        var(--gold);

    }


    .wholesale-proof-header {

      display:flex;

      justify-content:
        space-between;

      align-items:flex-start;

      gap:10px;

      padding-bottom:
        10px;

      border-bottom:
        1px solid
        var(--border);

    }


    .wholesale-proof-header
    span {

      display:block;

      color:var(--gold);

      font-size:9px;

      font-weight:900;

      letter-spacing:.08em;

    }


    .wholesale-proof-header
    h2 {

      margin:
        2px 0 0;

    }


    .wholesale-proof-header
    > strong {

      padding:
        4px 7px;

      border-radius:
        999px;

      background:
        #f1e8d7;

      color:var(--gold);

      font-size:9px;

    }


    .wholesale-proof-grid {

      display:grid;

      gap:6px;

      margin-top:10px;

    }


    .wholesale-proof-grid
    > div {

      display:grid;

      grid-template-columns:
        120px 1fr;

      gap:8px;

      align-items:start;

    }


    .wholesale-proof-grid
    span,
    .wholesale-proof-note
    span {

      color:var(--muted);

      font-size:9px;

      font-weight:850;

      text-transform:uppercase;

    }


    .wholesale-proof-grid
    strong,
    .wholesale-proof-note
    strong {

      font-size:12px;

    }


    .wholesale-summary-product {

      margin-top:10px;

      padding-top:9px;

      border-top:
        1px solid
        var(--border);

    }


    .wholesale-summary-product
    > strong {

      display:block;

      font-size:14px;

    }


    .wholesale-proof-note {

      display:grid;

      grid-template-columns:
        120px 1fr;

      gap:8px;

      margin-top:10px;

      padding-top:9px;

      border-top:
        1px solid
        var(--border);

    }


    .wholesale-commercial-note {

      margin-top:11px;

      padding:9px;

      border-radius:10px;

      background:#f8f0e1;

      color:#6d5227;

      font-size:10px;

      line-height:1.4;

    }


    .wholesale-commercial-note
    strong {

      display:block;

      margin-top:2px;

    }


    .wholesale-signature-card {

      border-top:
        5px solid
        #2f7449;

    }


    .wholesale-signature-card
    > p {

      color:var(--muted);

      font-size:11px;

      line-height:1.45;

    }


    .wholesale-signature-box {

      position:relative;

      width:100%;

      height:190px;

      overflow:hidden;

      border:
        2px dashed
        #c7c0b0;

      border-radius:
        13px;

      background:#fff;

    }


    #wholesaleSignatureCanvas {

      display:block;

      width:100%;

      height:100%;

      touch-action:none;

    }


    .wholesale-signature-placeholder {

      position:absolute;

      inset:0;

      display:grid;

      place-items:center;

      pointer-events:none;

      color:#a39b8b;

      font-size:12px;

    }


    .wholesale-clear-signature {

      width:100%;

      min-height:40px;

      margin-top:6px;

      border:
        1px solid
        var(--border);

      border-radius:10px;

      background:white;

      color:var(--dark);

      font-size:11px;

      font-weight:850;

    }


    .wholesale-approval {

      display:flex;

      align-items:flex-start;

      gap:9px;

      margin-top:13px;

      padding:10px;

      border-radius:11px;

      background:#f8f7f3;

      border:
        1px solid
        var(--border);

    }


    .wholesale-approval
    input {

      width:21px;

      height:21px;

      min-width:21px;

      margin:0;

    }


    .wholesale-approval
    span {

      font-size:11px;

      line-height:1.4;

    }


    .wholesale-signature-status {

      margin:
        8px 0;

      padding:8px;

      border-radius:9px;

      background:#f1e8d7;

      color:#8c692f;

      text-align:center;

      font-size:10px;

      font-weight:900;

    }


    .wholesale-signature-status.signed {

      background:#e7f3eb;

      color:#2f7449;

    }


    @media(
      max-width:480px
    ) {

      .wholesale-proof-grid
      > div,

      .wholesale-proof-note {

        grid-template-columns:
          105px 1fr;

      }


      .wholesale-signature-box {

        height:175px;

      }

    }

  `;


  document.head
    .appendChild(
      style
    );

}


/* ============================================================
   GLOBAAL BESCHIKBAAR
============================================================ */

window.openWholesaleOrder =
  openWholesaleOrder;


window.downloadWholesaleProofPdf =
  downloadWholesaleProofPdf;
