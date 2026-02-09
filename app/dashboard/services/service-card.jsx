export function ServiceCard({ service }) {
  return (
    <div className="border rounded-lg p-5 space-y-4 bg-white shadow-sm">

      {/* SERVICE HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold capitalize">
            {service.service}
          </h2>
          <p className="text-sm text-gray-500">
            {service.description}
          </p>
          <p className="text-sm mt-1">
            ⏱ {service.duration} | Min Qty: {service.min_qtq}
          </p>
        </div>

        <div className="text-right">
          <p className="line-through text-gray-400">
            ₹{service.original}
          </p>
          <p className="text-lg font-bold text-green-600">
            ₹{service.discounted}
          </p>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="space-y-4">
        {service.category_list.map((cat) => (
          <div
            key={cat.category_id}
            className="border rounded p-4 bg-gray-50"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">
                {cat.category}
              </h3>
              <span className="font-bold">
                ₹{cat.price}
              </span>
            </div>

            {/* GARMENT TYPES */}
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">
              {cat.types_of_Clothes.map((cloth, index) => (
                <li
                  key={index}
                  className="bg-white border rounded px-2 py-1"
                >
                  {cloth}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
