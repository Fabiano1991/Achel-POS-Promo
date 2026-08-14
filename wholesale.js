/* ============================================================
   ACHEL POS
   BESTELLING GROOTHANDEL - TEST V1
   ============================================================ */


/*
  Voorlopig hetzelfde testadres.
  Later veranderen we alleen deze regel.
*/

const WHOLESALE_EMAIL =
  "fabiovenaruzzo@hotmail.com";


let wholesaleProducts = [];

const wholesaleQuantities = {};

const wholesaleDiscounts = {};



/* ============================================================
   MODULE START
============================================================ */

function initWholesaleModule() {

  createWholesaleMenuItem();

  createWholesaleScreen();

}



document.addEventListener(
  "DOMContentLoaded",
  initWholesaleModule
);


setTimeout(
  initWholesaleModule,
  500
);



/* ============================================================
   MENU ITEM TOEVOEGEN
============================================================ */

function createWholesaleMenuItem() {

  if (
    document.getElementById(
      "menuWholesale"
    )
  ) {

    return;

  }


  const adminButton =
    document.getElementById(
      "menuAdmin"
    );


  const menu =
    adminButton?.parentElement;


  if (!menu) {

    return;

  }


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "menuWholesale";


  button.className =
    "menu-item";


  button.type =
    "button";


  button.innerText =
    "Bestelling groothandel";


  button.onclick =
    openWholesaleOrder;


  menu.insertBefore(
    button,
    adminButton
  );

}



/* ============================================================
   SCHERM MAKEN
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


  if (!appMain) {

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

      <h2>
        Bestelling groothandel
      </h2>


      <p
        style="
          color:var(--muted);
          margin-top:-5px;
          line-height:1.45;
        "
      >
        Maak een bierbestelling voor levering via een drankenhandel.
      </p>


      <label>
        Vertegenwoordiger
      </label>


      <div class="profile-box">

        <strong id="wholesaleRepName">
        </strong>

        <small id="wholesaleRepEmail">
        </small>

      </div>


      <label for="wholesaleReference">
        Referentie / klantnaam
      </label>


      <input
        id="wholesaleReference"
        type="text"
        placeholder="Bijv. Café De Markt"
      >


      <label for="wholesaleDealerSelect">
        Drankenhandel
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
          Naam drankenhandel
        </label>


        <input
          id="wholesaleDealerOther"
          type="text"
          placeholder="Bijv. naam drankenhandel"
        >

      </div>


      <label for="wholesaleNote">
        Opmerking
      </label>


      <textarea
        id="wholesaleNote"
        placeholder="Optionele informatie voor de bestelling"
      ></textarea>

    </div>



    <div class="card">

      <h2>
        Bieren
      </h2>


      <div
        id="wholesaleProductsList"
      >

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
   CONTROLE SCHERM
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


    <div class="card">

      <h2>
        Controleer bestelling
      </h2>


      <p>

        <strong>
          Vertegenwoordiger
        </strong>

        <br>

        <span id="wholesaleSummaryRep">
        </span>

      </p>


      <p>

        <strong>
          Referentie / klant
        </strong>

        <br>

        <span id="wholesaleSummaryReference">
        </span>

      </p>


      <p>

        <strong>
          Drankenhandel
        </strong>

        <br>

        <span id="wholesaleSummaryDealer">
        </span>

      </p>


      <div
        id="wholesaleSummaryProducts"
      >
      </div>


      <p
        id="wholesaleSummaryNote"
      >
      </p>


      <button
        id="wholesaleSubmitButton"
        class="primary"
        type="button"
        onclick="submitWholesaleOrder()"
      >
        Bestelling verzenden
      </button>

    </div>

  `;


  appMain.appendChild(
    section
  );

}
function resetWholesaleOrder() {

  /*
    VELDEN
  */

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


  if (reference) {
    reference.value = "";
  }


  if (dealerSelect) {
    dealerSelect.value = "";
  }


  if (dealerOther) {
    dealerOther.value = "";
  }


  if (note) {
    note.value = "";
  }



  /*
    ANDERE DRANKENHANDEL
    VELD VERBERGEN
  */

  document
    .getElementById(
      "wholesaleDealerOtherBox"
    )
    ?.classList
    .add("hidden");



  /*
    AANTALLEN RESETTEN
  */

  Object.keys(
    wholesaleQuantities
  )
    .forEach(
      productId => {

        wholesaleQuantities[
          productId
        ] = 0;

      }
    );



  /*
    KORTINGEN RESETTEN
  */

  Object.keys(
    wholesaleDiscounts
  )
    .forEach(
      productId => {

        wholesaleDiscounts[
          productId
        ] = "geen";

      }
    );



  /*
    PRODUCTLIJST OPNIEUW TONEN
  */

  renderWholesaleProducts();

}


/* ============================================================
   SCHERM OPENEN
============================================================ */

async function openWholesaleOrder() {

  closeMenu();


  hideWholesaleOtherScreens();


  document
    .getElementById(
      "wholesaleScreen"
    )
    .classList
    .remove("hidden");


  document
    .getElementById(
      "wholesaleRepName"
    )
    .innerText =
      currentProfile?.naam
      ||
      "";


  document
    .getElementById(
      "wholesaleRepEmail"
    )
    .innerText =
      currentProfile?.email
      ||
      currentUser?.email
      ||
      "";


  await loadWholesaleProducts();

}



/* ============================================================
   ANDERE SCHERMEN VERBERGEN
============================================================ */

function hideWholesaleOtherScreens() {

  [

    "homeScreen",

    "orderScreen",

    "summaryScreen",

    "successScreen",

    "ordersScreen",

    "adminScreen",

    "adminDetailScreen",

    "wholesaleScreen",

    "wholesaleSummaryScreen"

  ]

    .forEach(
      id => {

        document
          .getElementById(id)
          ?.classList
          .add("hidden");

      }
    );

}



/* ============================================================
   TERUG
============================================================ */

function closeWholesaleOrder() {

  hideWholesaleOtherScreens();

  goHome();

}



function backToWholesaleOrder() {

  hideWholesaleOtherScreens();


  document
    .getElementById(
      "wholesaleScreen"
    )
    .classList
    .remove("hidden");

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
      value !== "other"
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
    selectValue === "other"
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


  if (error) {

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
    data || [];


  wholesaleProducts
    .forEach(
      product => {

        if (
          wholesaleQuantities[
            product.id
          ] === undefined
        ) {

          wholesaleQuantities[
            product.id
          ] = 0;

        }


        if (
          wholesaleDiscounts[
            product.id
          ] === undefined
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

            <div
              style="
                border:1px solid var(--border);
                border-radius:16px;
                padding:14px;
                margin-bottom:10px;
                background:white;
              "
            >


              <div
                style="
                  font-weight:850;
                  font-size:16px;
                "
              >

                ${wholesaleEscapeHtml(
                  product.naam
                )}

              </div>


              <div
                style="
                  font-size:11px;
                  color:var(--muted);
                  margin-top:3px;
                "
              >

                ${
                  wholesaleEscapeHtml(
                    product.eenheid
                    ||
                    ""
                  )
                }

              </div>



              <div
                style="
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  gap:12px;
                  margin-top:14px;
                "
              >


                <div
                  style="
                    font-size:13px;
                    font-weight:750;
                  "
                >

                  ${
                    isKeg
                      ? "Betaalde vaten"
                      : "Aantal"
                  }

                </div>


                <div class="qty">

                  <button
                    type="button"
                    onclick="
                      changeWholesaleQty(
                        ${product.id},
                        -1
                      )
                    "
                  >
                    −
                  </button>


                  <span
                    id="wholesaleQty-${product.id}"
                  >

                    ${
                      wholesaleQuantities[
                        product.id
                      ]
                      ||
                      0
                    }

                  </span>


                  <button
                    type="button"
                    onclick="
                      changeWholesaleQty(
                        ${product.id},
                        1
                      )
                    "
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
                      style="margin-top:14px;"
                    >

                      Commerciële tegemoetkoming

                    </label>


                    <select
                      id="wholesaleDiscount-${product.id}"
                      onchange="
                        changeWholesaleDiscount(
                          ${product.id},
                          this.value
                        )
                      "
                    >

                      <option
                        value="geen"
                        ${
                          wholesaleDiscounts[
                            product.id
                          ] === "geen"
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
                          ] === "5+1"
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
                          ] === "10+2"
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
                        calculation.free > 0
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
      product.eenheid
      ||
      ""
    )
      .toLowerCase();


  const name =

    String(
      product.naam
      ||
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
   AANTAL WIJZIGEN
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
        ]
        ||
        0
      )

      +

      amount

    );


  const qtyElement =

    document
      .getElementById(
        `wholesaleQty-${productId}`
      );


  if (qtyElement) {

    qtyElement.innerText =

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
   KORTING WIJZIGEN
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
   BEREKENING
============================================================ */

function calculateWholesaleProduct(
  product
) {

  const paid =

    Number(
      wholesaleQuantities[
        product.id
      ]
      ||
      0
    );


  const discount =

    isWholesaleKeg(
      product
    )

      ? (
          wholesaleDiscounts[
            product.id
          ]
          ||
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
        paid / 5
      );

  }


  if (
    discount ===
    "10+2"
  ) {

    free =

      Math.floor(
        paid / 10
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
      paid + free

  };

}



/* ============================================================
   BEREKENING TEKST
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
    calculation.free === 0
  ) {

    return (

      `Actie ${calculation.discount} geselecteerd. `

      +

      `Het ingegeven aantal geeft momenteel nog geen gratis vat.`

    );

  }


  return (

    `${calculation.paid} betaald + `

    +

    `${calculation.free} gratis = `

    +

    `${calculation.total} vaten totaal te leveren. `

    +

    `Gratis vat(en): commerciële tegemoetkoming, enkel leeggoed factureren.`

  );

}



/* ============================================================
   BEREKENING OP SCHERM BIJWERKEN
============================================================ */

function updateWholesaleCalculation(
  productId
) {

  const product =

    wholesaleProducts.find(
      item =>
        item.id ===
        productId
    );


  if (
    !product
    ||
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


  if (!element) {

    return;

  }


  element.className =

    calculation.free > 0

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
          ]
          ||
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

          ...product,

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
   BESTELKNOP
============================================================ */

function updateWholesaleReviewButton() {

  const products =

    getSelectedWholesaleProducts();


  const total =

    products.reduce(
      (
        sum,
        product
      ) =>

        sum
        +
        product.total,

      0
    );


  const button =

    document
      .getElementById(
        "wholesaleReviewButton"
      );


  if (!button) {

    return;

  }


  button.innerText =

    total > 0

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
      "Vul de drankenhandel in."
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

      currentProfile?.naam
      ||
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
          product =>

            buildWholesaleSummaryProduct(
              product
            )
        )

        .join("");


  document
    .getElementById(
      "wholesaleSummaryNote"
    )
    .innerText =

      note

        ? `Opmerking: ${note}`

        : "";


  hideWholesaleOtherScreens();


  document
    .getElementById(
      "wholesaleSummaryScreen"
    )
    .classList
    .remove("hidden");

}



/* ============================================================
   SAMENVATTING PRODUCT
============================================================ */

function buildWholesaleSummaryProduct(
  product
) {

  const isKeg =
    isWholesaleKeg(
      product
    );


  return `

    <div
      class="summary-section"
    >

      <div
        class="summary-section-title"
      >

        ${wholesaleEscapeHtml(
          product.naam
        )}

      </div>


      <div
        class="summary-line"
      >

        <span>
          ${
            isKeg
              ? "Betaald"
              : "Aantal"
          }
        </span>

        <strong>
          ${product.paid}
        </strong>

      </div>


      ${
        isKeg
        &&
        product.discount !==
        "geen"

          ? `

            <div
              class="summary-line"
            >

              <span>
                Actie
              </span>

              <strong>
                ${product.discount}
              </strong>

            </div>


            <div
              class="summary-line"
            >

              <span>
                Gratis
              </span>

              <strong>
                ${product.free}
              </strong>

            </div>


            <div
              class="summary-line"
            >

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


      ${
        product.free > 0

          ? `

            <div
              class="info ok"
            >

              Gratis vat(en) zijn commerciële tegemoetkoming.
              Enkel leeggoed factureren voor de gratis vaten.

            </div>

          `

          : ""
      }


    </div>

  `;

}



/* ============================================================
   BESTELLING OPSLAAN
============================================================ */

let wholesaleSubmitting = false;


async function submitWholesaleOrder() {

  /*
    DUBBELKLIK BEVEILIGING
  */

  if (wholesaleSubmitting) {

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


  if (!reference) {

    alert(
      "Vul een referentie of klantnaam in."
    );

    return;

  }


  if (!dealer) {

    alert(
      "Vul een drankenhandel in."
    );

    return;

  }


  if (!products.length) {

    alert(
      "Selecteer minstens één bier."
    );

    return;

  }



  const button =
    document.getElementById(
      "wholesaleSubmitButton"
    );


  wholesaleSubmitting =
    true;


  button.disabled =
    true;


  button.innerText =
    "Bestelling wordt verwerkt...";



  /*
    BESTELREGELS VOOR SUPABASE
  */

  const items =

    products.map(
      product => ({

        product_id:
          product.id,

        product_naam:
          product.naam,

        eenheid:
          product.eenheid || "",

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



  /*
    ALLES IN 1 DATABASE TRANSACTIE
  */

  const {
    data: orderId,
    error
  } =

    await supabaseClient
      .rpc(
        "create_wholesale_order",
        {

          p_referentie:
            reference,

          p_drankenhandel:
            dealer,

          p_opmerking:
            note || null,

          p_items:
            items

        }
      );



  if (error) {

    wholesaleSubmitting =
      false;


    button.disabled =
      false;


    button.innerText =
      "Bestelling verzenden";


    alert(
      "Bestelling kon niet worden opgeslagen: "
      +
      error.message
    );


    return;

  }



  /*
    REFERENTIENUMMER
  */

  const orderReference =

    `GH-${new Date().getFullYear()}-${String(orderId)
      .slice(0, 8)
      .toUpperCase()}`;



  /*
    KNOP DEFINITIEF BLOKKEREN
  */

  button.disabled =
    true;


  button.innerText =
    "Bestelling opgeslagen";



  /*
    EERST DATA RESETTEN
    zodat dezelfde bestelling
    niet opnieuw verstuurd kan worden.
  */

  resetWholesaleOrder();



  /*
    MAIL PAS DAARNA OPENEN
  */

  openWholesaleEmail(

    orderReference,

    reference,

    dealer,

    note,

    products

  );



  /*
    SUCCESMELDING
  */

  setTimeout(

    () => {

      wholesaleSubmitting =
        false;


      alert(
        "De bestelling is opgeslagen. Een nieuwe bestelling kan via het menu worden gestart."
      );


      goHome();

    },

    700

  );

}


  const button =

    document
      .getElementById(
        "wholesaleSubmitButton"
      );


  button.disabled =
    true;


  button.innerText =
    "Bestelling opslaan...";


  const {
    data: order,
    error: orderError
  } =

    await supabaseClient

      .from(
        "wholesale_orders"
      )

      .insert({

        user_id:
          currentUser.id,

        referentie:
          reference,

        drankenhandel:
          dealer,

        opmerking:
          note || null,

        status:
          "besteld"

      })

      .select(
        "id, created_at"
      )

      .single();


  if (
    orderError
    ||
    !order
  ) {

    button.disabled =
      false;


    button.innerText =
      "Bestelling verzenden";


    alert(

      "Bestelling kon niet worden opgeslagen: "

      +

      (
        orderError?.message
        ||
        "Onbekende fout"
      )

    );


    return;

  }



  const rows =

    products.map(
      product => ({

        wholesale_order_id:
          order.id,

        product_id:
          product.id,

        product_naam:
          product.naam,

        eenheid:
          product.eenheid
          ||
          null,

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


  const {
    error: itemsError
  } =

    await supabaseClient

      .from(
        "wholesale_order_items"
      )

      .insert(
        rows
      );


  button.disabled =
    false;


  button.innerText =
    "Bestelling verzenden";


  if (
    itemsError
  ) {

    alert(

      "Bestelling is aangemaakt, maar de bestelregels konden niet worden opgeslagen: "

      +

      itemsError.message

    );


    return;

  }


  const referenceNumber =

    createWholesaleReference(
      order.id,
      order.created_at
    );


  openWholesaleEmail(

    referenceNumber,

    reference,

    dealer,

    note,

    products

  );

}



/* ============================================================
   REFERENTIENUMMER
============================================================ */

function createWholesaleReference(
  id,
  createdAt
) {

  const year =

    new Date(
      createdAt
      ||
      Date.now()
    )
      .getFullYear();


  return (

    `GH-${year}-${id.slice(0,8).toUpperCase()}`

  );

}



/* ============================================================
   MAIL
============================================================ */

function openWholesaleEmail(
  orderNumber,
  reference,
  dealer,
  note,
  products
) {

  let orderText =
    "";


  products
    .forEach(
      product => {

        orderText +=

`${product.product_naam || product.naam}
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
              product.free > 0
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
`\n`;

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

BESTELLING
====================

${orderText}

OPMERKING
====================

${note || "Geen opmerkingen"}

Deze bestelling is centraal opgeslagen in Achel POS.`;


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
    350
  );

}



/* ============================================================
   VEILIGE HTML
============================================================ */

function wholesaleEscapeHtml(
  value
) {

  return String(
    value ?? ""
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
