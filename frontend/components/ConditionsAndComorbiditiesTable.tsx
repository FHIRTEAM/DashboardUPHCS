// components/ConditionsAndComorbiditiesTable.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  groupedConditions: {
    condition: string;
    comorbidities: string[];
  }[];
}

const ConditionsAndComorbiditiesTable: React.FC<Props> = ({ groupedConditions }) => {
  return (
    <Card>
      <div className="bg-red-700 text-white text-lg font-semibold px-4 py-2 rounded-t-2xl">
        Conditions & Major Observations
      </div>
      <CardContent>
        <div className="overflow-x-auto">
          {groupedConditions?.length ? (
            <table className="min-w-full text-sm text-left">
              <thead className="bg-red-800 text-white">
                <tr>
                  <th className="py-2 px-4">Conditions</th>
                  <th className="py-2 px-4">Comorbidities</th>
                </tr>
              </thead>
              <tbody>
                {groupedConditions.map((entry, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 px-4 font-semibold text-gray-900 w-1/3">
                      {entry.condition}
                    </td>
                    <td className="py-2 px-4 text-gray-700">
                      {entry.comorbidities?.join('; ') || 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-4">No conditions found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConditionsAndComorbiditiesTable;
