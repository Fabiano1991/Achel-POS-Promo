/* ============================================================
   ACHEL POS - ADMIN RETOURMODULE
============================================================ */

let adminEventReturns = [];


/* ============================================================
   RETOURDATA LADEN
============================================================ */

async function loadEventReturnData() {

  const {
    data,
    error
  } =
    await supabaseClient

      .from(
        "event_material_returns"
      )

      .select(`
        id,
        order_id,
        product_naam,
        uitgeleend_aantal,
        goed_terug,
        beschadigd,
        ontbreekt,
        opmerking,
        updated_by,
        created_at,
        updated_at
      `);


  if (
    error
  ) {

    console.log(
      "Retourdata fout:",
      error
    );


    adminEventReturns =
      [];


    return;

  }


  adminEventReturns =
    data
    ||
    [];

}



/* ============================================================
   RETOURDATA PER ORDER
============================================================ */

function getEventReturnsForOrder(
  orderId
) {

  return adminEventReturns.filter(

    item =>
      item.order_id ===
      orderId

  );

}



/* ============================================================
   RETOUR EDITOR BOUWEN
============================================================ */

function buildEventReturnEditor(
  order
) {

  if (
    !order.event_naam
  ) {

    return "";

  }


  if (
    order.status !==
    "afgehaald"
  ) {

    return `

      <div class="card">

        <h2>
          Retour evenementmateriaal
        </h2>


        <div class="info">

          Retourregistratie wordt beschikbaar zodra
          het evenementmateriaal als afgehaald is geregistreerd.

        </div>

      </div>

    `;

  }


  const items =

    getAdminOrderItems(
      order.id
    )

      .filter(

        item =>
          item.categorie ===
          "evenement"

      );


  const rows =

    items

      .map(

        item => {


          const existing =

            adminEventReturns.find(

              row =>

                row.order_id ===
                order.id

                &&

                row.product_naam ===
                item.product_naam

            );


          const good =

            Number(
              existing?.goed_terug
              ||
              0
            );


          const damaged =

            Number(
              existing?.beschadigd
              ||
              0
            );


          const missing =

            Number(
              existing?.ontbreekt
              ||
              0
            );


          return `

            <div
              style="
                border:1px solid var(--border);
                border-radius:16px;
                padding:14px;
                margin-top:12px;
                background:white;
              "
            >


              <div
                style="
                  font-size:18px;
                  font-weight:900;
                "
              >

                ${adminEscapeHtml(
                  item.product_naam
                )}

              </div>


              <div
                class="order-meta"
                style="
                  margin-top:5px;
                "
              >

                Uitgeleend:

                <strong>
                  ${item.aantal}
                </strong>

              </div>



              ${buildReturnQuantityControl(

                order.id,

                item.product_naam,

                "good",

                "Goed terug",

                good

              )}



              ${buildReturnQuantityControl(

                order.id,

                item.product_naam,

                "damaged",

                "Beschadigd / kapot",

                damaged

              )}



              ${buildReturnQuantityControl(

                order.id,

                item.product_naam,

                "missing",

                "Ontbreekt",

                missing

              )}



              <div
                id="${returnDomId(
                  order.id,
                  item.product_naam,
                  "outside"
                )}"
                class="info"
                style="
                  margin-top:14px;
                  font-weight:900;
                "
              >

                Nog buiten:
                0

              </div>



              <label>
                Opmerking
              </label>


              <textarea
                id="${returnDomId(
                  order.id,
                  item.product_naam,
                  "note"
                )}"
                placeholder="Bijv. scheur in tent, poot afgebroken, materiaal nog bij klant..."
              >${adminEscapeHtml(existing?.opmerking || "")}</textarea>


            </div>

          `;

        }

      )

      .join("");


  return `

    <div class="card">


      <h2>
        Retour evenementmateriaal
      </h2>


      <p
        style="
          color:var(--muted);
          line-height:1.5;
        "
      >

        Registreer per materiaal wat goed terugkomt,
        beschadigd is of ontbreekt.

        Wat nog niet is verwerkt blijft automatisch
        als <strong>Nog buiten</strong> geregistreerd.

      </p>


      ${rows}



      <button
        class="primary"
        type="button"
        onclick="saveEventReturnRegistration('${order.id}')"
        style="
          margin-top:18px;
        "
      >

        Retourregistratie opslaan

      </button>



      ${
        getEventReturnsForOrder(
          order.id
        ).length

          ? `

              <button
                class="secondary"
                type="button"
                onclick="resetEventReturnRegistration('${order.id}')"
              >

                Retourregistratie volledig wissen

              </button>

            `

          : ""
      }


    </div>

  `;

}



/* ============================================================
   +/- CONTROL
============================================================ */

function buildReturnQuantityControl(

  orderId,

  productName,

  type,

  label,

  value

) {

  const safeProductName =

    escapeReturnJsString(
      productName
    );


  return `

    <div
      style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-top:15px;
      "
    >


      <div
        style="
          font-size:14px;
          font-weight:800;
        "
      >

        ${label}

      </div>



      <div class="qty">


        <button
          type="button"
          onclick="changeReturnQuantity(
            '${orderId}',
            '${safeProductName}',
            '${type}',
            -1
          )"
        >

          −

        </button>



        <span
          id="${returnDomId(
            orderId,
            productName,
            type
          )}"
        >

          ${value}

        </span>



        <button
          type="button"
          onclick="changeReturnQuantity(
            '${orderId}',
            '${safeProductName}',
            '${type}',
            1
          )"
        >

          +

        </button>


      </div>


    </div>

  `;

}



/* ============================================================
   VEILIGE DOM ID
============================================================ */

function returnDomId(

  orderId,

  productName,

  type

) {

  const safeOrder =

    String(
      orderId
    )
      .replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );


  const safeProduct =

    String(
      productName
      ||
      ""
    )
      .replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );


  return (

    `return_${safeOrder}_${safeProduct}_${type}`

  );

}



/* ============================================================
   +/- WIJZIGEN
============================================================ */

function changeReturnQuantity(

  orderId,

  productName,

  type,

  amount

) {

  const item =

    getAdminOrderItems(
      orderId
    )

      .find(

        row =>

          row.product_naam ===
          productName

          &&

          row.categorie ===
          "evenement"

      );


  if (
    !item
  ) {

    return;

  }


  const element =

    document.getElementById(

      returnDomId(

        orderId,

        productName,

        type

      )

    );


  if (
    !element
  ) {

    return;

  }


  const current =

    Number(
      element.innerText
      ||
      0
    );


  const next =

    Math.max(

      0,

      current
      +
      amount

    );



  const good =

    type ===
    "good"

      ? next

      : getReturnScreenValue(

          orderId,

          productName,

          "good"

        );



  const damaged =

    type ===
    "damaged"

      ? next

      : getReturnScreenValue(

          orderId,

          productName,

          "damaged"

        );



  const missing =

    type ===
    "missing"

      ? next

      : getReturnScreenValue(

          orderId,

          productName,

          "missing"

        );



  const processed =

    good
    +
    damaged
    +
    missing;



  if (

    processed

    >

    Number(
      item.aantal
      ||
      0
    )

  ) {

    alert(

      `Je kunt voor ${productName} maximaal ${item.aantal} stuk(s) verwerken.`

    );


    return;

  }


  element.innerText =
    next;


  updateReturnCalculation(

    orderId,

    productName

  );

}



/* ============================================================
   VALUE LEZEN
============================================================ */

function getReturnScreenValue(

  orderId,

  productName,

  type

) {

  const element =

    document.getElementById(

      returnDomId(

        orderId,

        productName,

        type

      )

    );


  return Number(

    element?.innerText

    ||

    0

  );

}



/* ============================================================
   NOG BUITEN
============================================================ */

function updateReturnCalculation(

  orderId,

  productName

) {

  const item =

    getAdminOrderItems(
      orderId
    )

      .find(

        row =>

          row.product_naam ===
          productName

          &&

          row.categorie ===
          "evenement"

      );


  if (
    !item
  ) {

    return;

  }



  const good =

    getReturnScreenValue(

      orderId,

      productName,

      "good"

    );



  const damaged =

    getReturnScreenValue(

      orderId,

      productName,

      "damaged"

    );



  const missing =

    getReturnScreenValue(

      orderId,

      productName,

      "missing"

    );



  const outside =

    Math.max(

      0,

      Number(
        item.aantal
        ||
        0
      )

      -

      good

      -

      damaged

      -

      missing

    );



  const element =

    document.getElementById(

      returnDomId(

        orderId,

        productName,

        "outside"

      )

    );


  if (
    element
  ) {

    element.innerText =

      `Nog buiten: ${outside}`;


    element.className =

      outside ===
      0

        ? "info ok"

        : "info";

  }

}



/* ============================================================
   ALLE BEREKENINGEN
============================================================ */

function updateAllReturnCalculations(
  orderId
) {

  getAdminOrderItems(
    orderId
  )

    .filter(

      item =>
        item.categorie ===
        "evenement"

    )

    .forEach(

      item => {

        updateReturnCalculation(

          orderId,

          item.product_naam

        );

      }

    );

}



/* ============================================================
   OPSLAAN
============================================================ */

async function saveEventReturnRegistration(
  orderId
) {

  const eventItems =

    getAdminOrderItems(
      orderId
    )

      .filter(

        item =>
          item.categorie ===
          "evenement"

      );


  if (
    !eventItems.length
  ) {

    return;

  }



  const returns =

    eventItems.map(

      item => {


        const noteElement =

          document.getElementById(

            returnDomId(

              orderId,

              item.product_naam,

              "note"

            )

          );


        return {

          product_naam:
            item.product_naam,


          goed_terug:

            getReturnScreenValue(

              orderId,

              item.product_naam,

              "good"

            ),


          beschadigd:

            getReturnScreenValue(

              orderId,

              item.product_naam,

              "damaged"

            ),


          ontbreekt:

            getReturnScreenValue(

              orderId,

              item.product_naam,

              "missing"

            ),


          opmerking:

            noteElement?.value
              ?.trim()

            ||

            ""

        };

      }

    );



  const {
    error
  } =

    await supabaseClient

      .rpc(

        "save_event_material_returns",

        {

          p_order_id:
            orderId,

          p_returns:
            returns

        }

      );


  if (
    error
  ) {

    alert(

      "Retourregistratie kon niet worden opgeslagen: "

      +

      error.message

    );


    return;

  }



  await loadAdminDashboard();



  const refreshedOrder =

    adminOrders.find(

      order =>
        order.id ===
        orderId

    );


  if (
    refreshedOrder
  ) {

    selectedAdminOrder =
      refreshedOrder;


    renderAdminDetail(
      refreshedOrder
    );


    showOnly(
      "adminDetailScreen"
    );

  }



  alert(
    "Retourregistratie opgeslagen."
  );

}



/* ============================================================
   RETOUR WISSEN
============================================================ */

async function resetEventReturnRegistration(
  orderId
) {

  const confirmed =

    window.confirm(

      "Wil je de volledige retourregistratie voor dit evenement wissen?"

    );


  if (
    !confirmed
  ) {

    return;

  }



  const {
    error
  } =

    await supabaseClient

      .rpc(

        "reset_event_material_returns",

        {

          p_order_id:
            orderId

        }

      );


  if (
    error
  ) {

    alert(
      error.message
    );


    return;

  }



  await loadAdminDashboard();



  const refreshedOrder =

    adminOrders.find(

      order =>
        order.id ===
        orderId

    );


  if (
    refreshedOrder
  ) {

    selectedAdminOrder =
      refreshedOrder;


    renderAdminDetail(
      refreshedOrder
    );


    showOnly(
      "adminDetailScreen"
    );

  }

}



/* ============================================================
   JS STRING VEILIG MAKEN
============================================================ */

function escapeReturnJsString(
  value
) {

  return String(
    value
    ||
    ""
  )

    .replaceAll(
      "\\",
      "\\\\"
    )

    .replaceAll(
      "'",
      "\\'"
    )

    .replaceAll(
      "\n",
      " "
    )

    .replaceAll(
      "\r",
      " "
    );

}
