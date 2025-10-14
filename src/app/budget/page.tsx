export const metadata = {
  title: "Budget | Where Next",
  description: "Plan a trip budget in minutes and see if you're on track.",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function BudgetPage() {
  // purely clientless (no hooks), keeps it deploy-safe
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <section className="mb-8">
        <h1 className="text-3xl font-bold">Trip Budget</h1>
        <p className="mt-2 text-sm text-gray-600">
          Quick estimator to ballpark your trip. Sign in later to save and sync.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border p-6">
          <form id="budget-form" className="grid grid-cols-2 gap-4">
            <label className="col-span-2 text-sm font-medium">Trip basics</label>

            <div className="col-span-1">
              <div className="text-xs mb-1 text-gray-600">Nights</div>
              <input name="nights" type="number" defaultValue={7} min={1}
                className="w-full rounded border px-3 py-2"/>
            </div>
            <div className="col-span-1">
              <div className="text-xs mb-1 text-gray-600">Travelers</div>
              <input name="people" type="number" defaultValue={2} min={1}
                className="w-full rounded border px-3 py-2"/>
            </div>

            <label className="col-span-2 text-sm font-medium mt-4">Per-day costs (per person)</label>
            <div>
              <div className="text-xs mb-1 text-gray-600">Lodging (per night, room share)</div>
              <input name="lodging" type="number" defaultValue={120} min={0}
                className="w-full rounded border px-3 py-2"/>
            </div>
            <div>
              <div className="text-xs mb-1 text-gray-600">Food</div>
              <input name="food" type="number" defaultValue={45} min={0}
                className="w-full rounded border px-3 py-2"/>
            </div>
            <div>
              <div className="text-xs mb-1 text-gray-600">Local transport</div>
              <input name="transport" type="number" defaultValue={12} min={0}
                className="w-full rounded border px-3 py-2"/>
            </div>
            <div>
              <div className="text-xs mb-1 text-gray-600">Activities</div>
              <input name="activities" type="number" defaultValue={20} min={0}
                className="w-full rounded border px-3 py-2"/>
            </div>

            <label className="col-span-2 text-sm font-medium mt-4">One-time costs</label>
            <div>
              <div className="text-xs mb-1 text-gray-600">Flights (total)</div>
              <input name="flights" type="number" defaultValue={800} min={0}
                className="w-full rounded border px-3 py-2"/>
            </div>
            <div>
              <div className="text-xs mb-1 text-gray-600">Insurance/Fees (total)</div>
              <input name="fees" type="number" defaultValue={80} min={0}
                className="w-full rounded border px-3 py-2"/>
            </div>

            <div className="col-span-2 mt-4 flex gap-3">
              <button form="budget-form" type="button" id="calc-btn"
                className="rounded-md border px-4 py-2">Calculate</button>
              <a href="/auth/login?next=/budget"
                 className="rounded-md border px-4 py-2">Save to my account</a>
              <a href="/plan-trip" className="rounded-md border px-4 py-2">Plan a trip</a>
            </div>
          </form>
        </div>

        <aside className="grid gap-4">
          <Stat label="Estimated total" value="$—" />
          <Stat label="Per traveler" value="$—" />
          <Stat label="Per day" value="$—" />
          <div className="rounded-xl border p-4 text-sm text-gray-700">
            Tip: you can tweak nights/travelers and see the totals update instantly.
          </div>
        </aside>
      </section>

      {/* super-light inline script: no external deps */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  const byName = (n)=>document.querySelector('[name="'+n+'"]');
  const $ = (sel)=>document.querySelector(sel);
  function money(n){ return n.toLocaleString(undefined,{style:'currency',currency:'USD'}); }
  function calc(){
    const nights=+byName('nights').value||0, people=+byName('people').value||0;
    const lodging=+byName('lodging').value||0, food=+byName('food').value||0;
    const transport=+byName('transport').value||0, activities=+byName('activities').value||0;
    const flights=+byName('flights').value||0, fees=+byName('fees').value||0;
    const perDayPerPerson = food + transport + activities + (lodging/Math.max(people,1));
    const perDayAll = perDayPerPerson * Math.max(people,0);
    const variable = perDayAll * nights;
    const total = variable + flights + fees;
    const perTraveler = total / Math.max(people,1);
    const perDay = total / Math.max(nights,1);
    const stats = document.querySelectorAll('aside .rounded-xl.border .text-2xl');
    if(stats.length>=3){
      stats[0].textContent = money(total);
      stats[1].textContent = money(perTraveler);
      stats[2].textContent = money(perDay);
    }
  }
  ['input','change'].forEach(evt=>{
    document.getElementById('budget-form').addEventListener(evt, calc);
  });
  document.getElementById('calc-btn').addEventListener('click', calc);
  calc();
})();`,
        }}
      />
    </main>
  );
}
