export function ServiceCard({ service }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800
                    bg-white dark:bg-gray-900 shadow-sm
                    p-5 space-y-5">

      {/* HEADER */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold capitalize
                         text-gray-900 dark:text-gray-100">
            {service.service}
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {service.description}
          </p>

          <div className="flex gap-4 text-sm mt-2 text-gray-600 dark:text-gray-400">
            <span>⏱ {service.duration}</span>
            <span>📦 Min Qty: {service.min_qtq}</span>
          </div>
        </div>

        {/* PRICE */}
        <div className="text-right">
          <p className="text-sm line-through text-gray-400">
            ₹{service.original}
          </p>
          <p className="text-xl font-bold text-green-600">
            ₹{service.discounted}
          </p>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="space-y-4">
        {service.category_list.map((cat) => (
          <div
            key={cat.category_id}
            className="rounded-lg border border-gray-200 dark:border-gray-800
                       bg-gray-50 dark:bg-gray-800 p-4"
          >
            {/* CATEGORY HEADER */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                {cat.category}
              </h3>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                ₹{cat.price}
              </span>
            </div>

            {/* GARMENTS */}
            <div className="flex flex-wrap gap-2">
              {cat.types_of_Clothes.map((item, index) => (
                <span
                  key={index}
                  className="text-xs px-3 py-1 rounded-full
                             bg-white dark:bg-gray-700
                             border border-gray-200 dark:border-gray-600
                             text-gray-700 dark:text-gray-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
