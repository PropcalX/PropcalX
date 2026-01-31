export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Global Property Calculator</h1>
      <form className="w-full max-w-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Country
          </label>
          <select className="shadow border rounded w-full py-2 px-3 text-white-700">
            <option>United Kingdom</option>
            <option>Dubai</option>
            <option>Japan</option>
            <option>United Stats</option>
            <option>Thailand</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-white-700 text-sm font-bold mb-2">
            Property Price
          </label>
          <input
            type="number"
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            placeholder="Enter price in local currency"
          />
        </div>
        <div className="mb-6">
          <label className="block text-white-700 text-sm font-bold mb-2">
            Monthly Rent
          </label>
          <input
            type="number"
            className="shadow border rounded w-full py-2 px-3 text-white-700"
            placeholder="Enter monthly rent"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Calculate
        </button>
      </form>
    </main>
  );
}