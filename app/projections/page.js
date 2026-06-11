'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  getProjections,
  saveProjection,
  updateProjection,
  deleteProjection,
  getForexRates,
  getResources,
  getServiceProjections,
  saveServiceProjection,
  updateServiceProjection,
  deleteServiceProjection
} from '../../lib/storage'

function getWorkDaysInQuarter(
  year,
  quarter
) {

  const quarterMonths = {
    Q1: [0, 1, 2],
    Q2: [3, 4, 5],
    Q3: [6, 7, 8],
    Q4: [9, 10, 11]
  }

  let workDays = 0

  quarterMonths[quarter].forEach(
    (month) => {

      const date =
        new Date(
          Number(year),
          month,
          1
        )

      while (
        date.getMonth() === month
      ) {

        const day =
          date.getDay()

        if (
          day !== 0 &&
          day !== 6
        ) {
          workDays++
        }

        date.setDate(
          date.getDate() + 1
        )
      }
    }
  )

  return workDays
}

export default function ProjectionsPage() {

  const [projections, setProjections] = useState([])
  const [resources, setResources] = useState([])

  const [year, setYear] = useState('2026')
  const [quarter, setQuarter] = useState('Q1')
  const [project, setProject] = useState('')
  const [resource, setResource] = useState('')
  const selectedResource = resources.find((r) => r.resourceName === resource)
  const hoursPerDay = selectedResource?.hoursPerDay || 0
  const manHourRate = selectedResource?.manHourRate || 0
  const currency = selectedResource?.currency || ''
  const purpose = selectedResource?.purpose || ''
  const [workDays, setWorkDays] = useState(0)
  // const [hoursPerDay, setHoursPerDay] = useState('8')
  // const [manHourRate, setManHourRate] = useState('')
  // const [currency, setCurrency] = useState('SEK')
  const [fteFactor, setFteFactor] = useState('1')
  const [forexRates, setForexRates] = useState([])

  const [serviceProjections, setServiceProjections] = useState([])
  const [serviceYear, setServiceYear] = useState('2026')
  const [serviceQuarter, setServiceQuarter] = useState('Q1')
  const [serviceProject, setServiceProject] = useState('')
  const [servicePurpose, setServicePurpose] = useState('')
  const [serviceCurrency, setServiceCurrency] = useState('SEK')
  const [serviceBudget, setServiceBudget] = useState('')
  const [editingServiceId, setEditingServiceId] = useState(null)
  
  const [editingId, setEditingId] = useState(null)

  // Filters
  const [filterYear, setFilterYear] = useState('')
  const [filterQuarter, setFilterQuarter] = useState('')
  const [filterProject, setFilterProject] = useState('All Projects')
  const [filterPurpose, setFilterPurpose] = useState('')

  const [staffColumns, setStaffColumns] = useState({
  year: true,
  quarter: true,
  project: true,
  resource: true,
  purpose: true,
  days: true,
  hours: true,
  rate: true,
  currency: true,
  fte: true,
  budget: true,
  actions: true
})

  const [serviceColumns, setServiceColumns] = useState({
  year: true,
  quarter: true,
  project: true,
  purpose: true,
  currency: true,
  budget: true,
  budgetSEK: true,
  actions: true
})

  // const [serviceFilterYear, setServiceFilterYear] = useState('')
  // const [serviceFilterQuarter, setServiceFilterQuarter] = useState('')
  // const [serviceFilterProject, setServiceFilterProject] = useState('')
  // const [serviceFilterPurpose, setServiceFilterPurpose] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {

  setWorkDays(
    getWorkDaysInQuarter(
      year,
      quarter
    )
  )

}, [year, quarter])
  
  function loadData() {

  setProjections(
    getProjections()
  )

  setForexRates(
    getForexRates()
  )

  setResources(
    getResources()
  )

  setServiceProjections(
    getServiceProjections()
  )

}

function convertToSEK(
  amount,
  currency
) {

  if (currency === 'SEK')
    return amount

  const rate =
    forexRates.find(
      (r) =>
        r.currency === currency
    )

  return rate
    ? amount * rate.rate
    : amount
}
  
  const projectedBudget =
    Number(workDays || 0) *
    Number(hoursPerDay || 0) *
    Number(manHourRate || 0) *
    Number(fteFactor || 0)

  function clearForm() {

    setYear('2026')
    setQuarter('Q1')
    setProject('')
    setResource('')
    setWorkDays(getWorkDaysInQuarter(year, quarter))
    setFteFactor('1')

    setEditingId(null)
  }

  function clearServiceForm() {

  setServiceYear('2026')

  setServiceQuarter('Q1')

  setServiceProject('')

  setServicePurpose('')

  setServiceCurrency('SEK')

  setServiceBudget('')

  setEditingServiceId(null)
}
  
  function handleSave() {

    const record = {
  id: editingId || Date.now(),

  year,
  quarter,

  project,

  resource,
  purpose,

  workDays,

  hoursPerDay,

  manHourRate,

  currency,

  fteFactor
}

    if (editingId) {
      updateProjection(
        editingId,
        record
      )
    } else {
      saveProjection(record)
    }

    loadData()
    clearForm()
  }

  function handleSaveService() {

  const record = {

    id:
      editingServiceId ||
      Date.now(),

    year:
      serviceYear,

    quarter:
      serviceQuarter,

    project:
      serviceProject,

    purpose:
      servicePurpose,

    currency:
      serviceCurrency,

    projectedBudget:
      Number(
        serviceBudget
      )
  }

  if (
    editingServiceId
  ) {

    updateServiceProjection(
      editingServiceId,
      record
    )

  } else {

    saveServiceProjection(
      record
    )
  }

  loadData()

  clearServiceForm()
}
  
  function handleEdit(item) {

    setEditingId(item.id)

    setYear(item.year)
    setQuarter(item.quarter)

    setProject(item.project)
    setResource(item.resource)

    // setWorkDays(item.workDays)
    // setHoursPerDay(item.hoursPerDay)

    // setManHourRate(item.manHourRate)

    // setCurrency(item.currency)

    setFteFactor(item.fteFactor)
  }

  function handleEditService(
  item
) {

  setEditingServiceId(
    item.id
  )

  setServiceYear(
    item.year
  )

  setServiceQuarter(
    item.quarter
  )

  setServiceProject(
    item.project
  )

  setServicePurpose(
    item.purpose
  )

  setServiceCurrency(
    item.currency
  )

  setServiceBudget(
    item.projectedBudget
  )
}
  
  function handleDelete(id) {

    if (
      !confirm(
        'Delete this projection?'
      )
    ) {
      return
    }

    deleteProjection(id)

    loadData()
  }

  function handleDeleteService(
  id
) {

  if (
    !confirm(
      'Delete service projection?'
    )
  ) {
    return
  }

  deleteServiceProjection(
    id
  )

  loadData()
}
  
  const filteredProjections =
  projections.filter((p) => {

    return (

      (!filterYear ||
        p.year === filterYear)

      &&

      (!filterQuarter ||
        p.quarter === filterQuarter)

      &&

      (
        filterProject ===
          'All Projects' ||

        p.project ===
          filterProject
      )

      &&

      (!filterPurpose ||

        p.purpose
          .toLowerCase()
          .includes(
            filterPurpose
              .toLowerCase()
          ))
    )
  })

  const filteredServiceProjections =
  serviceProjections.filter(
    (item) => {

      return (

        (!filterYear ||
          item.year === filterYear)

        &&

        (!filterQuarter ||
          item.quarter === filterQuarter)

        &&

        (
          filterProject ===
            'All Projects' ||

          item.project ===
            filterProject
        )

        &&

        (!filterPurpose ||

          item.purpose
            .toLowerCase()
            .includes(
              filterPurpose
                .toLowerCase()
            ))
      )
    }
  )

  const totalProjectedBudgetSEK =
  filteredProjections.reduce(
    (sum, p) => {

      const projectedBudget =
        p.workDays *
        p.hoursPerDay *
        p.manHourRate *
        p.fteFactor

      return (
        sum +
        convertToSEK(
          projectedBudget,
          p.currency
        )
      )
    },
    0
  )

  const totalServiceSEK =
  filteredServiceProjections.reduce(
    (sum, item) => {

      return (
        sum +
        convertToSEK(
          item.projectedBudget,
          item.currency
        )
      )

    },
    0
  )
  
  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'Arial'
      }}
    >

      <h1>Projection Planning</h1>

      {/* Navigation */}
      <div
        style={{
          marginBottom: 20
        }}
      >

        <Link href="/">
          <button>
            Dashboard
          </button>
        </Link>

        <Link
          href="/add-budget"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Budget
          </button>
        </Link>

        <Link
          href="/add-expense"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Expense
          </button>
        </Link>

        <Link
          href="/forex-rates"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Forex Rates
          </button>
        </Link>

        <Link href="/resource-master" style={{ marginLeft: 10 }}>
          <button>Resource Master</button>
        </Link>

      </div>

      <hr />

      <h2>
        Add Staff Cost Projection
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3, 1fr)',
          gap: 10,
          maxWidth: 900
        }}
      >

        <select
          value={year}
          onChange={(e) =>
            setYear(
              e.target.value
            )
          }
        >
          <option>2025</option>
          <option>2026</option>
          <option>2027</option>
        </select>

        <select
          value={quarter}
          onChange={(e) =>
            setQuarter(
              e.target.value
            )
          }
        >
          <option>Q1</option>
          <option>Q2</option>
          <option>Q3</option>
          <option>Q4</option>
        </select>

        <input
          placeholder="Project"
          value={project}
          onChange={(e) =>
            setProject(
              e.target.value
            )
          }
        />

        <select
  value={resource}
  onChange={(e) =>
    setResource(
      e.target.value
    )
  }
>

  <option value="">
    Select Resource
  </option>

  {resources
    .filter(
      (r) => r.active
    )
    .map((r) => (

      <option
        key={r.id}
        value={
          r.resourceName
        }
      >
        {r.resourceName}
      </option>

    ))}

</select>

      <input
  value={purpose}
  readOnly
  placeholder="Purpose"
/>

        <input
          value={workDays}
          readOnly
        />

        <input
  value={hoursPerDay}
  readOnly
/>

        <input
  value={manHourRate}
  readOnly
/>

        <input
  value={currency}
  readOnly
/>

        <input
          type="number"
          step="0.1"
          placeholder="FTE Factor"
          value={fteFactor}
          onChange={(e) =>
            setFteFactor(
              e.target.value
            )
          }
        />

      </div>

      <br />

      <h3>
        Projected Budget:
        {' '}
        {projectedBudget.toFixed(2)}
        {' '}
        {currency}
      </h3>

      <button
        onClick={handleSave}
      >
        {editingId
          ? 'Update Projection'
          : 'Save Projection'}
      </button>

      <hr />

      <h2>Filters</h2>

      <select
        value={filterYear}
        onChange={(e) =>
          setFilterYear(
            e.target.value
          )
        }
      >
        <option value="">
          All Years
        </option>

        <option>2025</option>
        <option>2026</option>
        <option>2027</option>
      </select>

      <select
        value={filterQuarter}
        onChange={(e) =>
          setFilterQuarter(
            e.target.value
          )
        }
        style={{
          marginLeft: 10
        }}
      >
        <option value="">
          All Quarters
        </option>

        <option>Q1</option>
        <option>Q2</option>
        <option>Q3</option>
        <option>Q4</option>
      </select>

      <select
  value={filterProject}
  onChange={(e) =>
    setFilterProject(
      e.target.value
    )
  }
  style={{
    marginLeft: 10
  }}
>
  <option>
    All Projects
  </option>

  {[
    ...new Set(
      projections
        .map(
          (p) => p.project
        )
        .filter(Boolean)
    )
  ].map((project) => (

    <option
      key={project}
      value={project}
    >
      {project}
    </option>

  ))}
</select>
  
<input
  placeholder="Purpose"
  value={filterPurpose}
  onChange={(e) =>
    setFilterPurpose(
      e.target.value
    )
  }
  style={{
    marginLeft: 10
  }}
/>

  <button
  onClick={() => {

    setFilterYear('')
    setFilterQuarter('')
    setFilterProject('All Projects')
    setFilterPurpose('')

  }}
  style={{
    marginLeft: 10
  }}
>
  Clear Filter
</button>
        
      <hr />

<div
  style={{
    marginBottom: 15,
    padding: 10,
    border: '1px solid #ddd'
  }}
>
  <strong>
    Show / Hide Staff Cost Columns
  </strong>

  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 10
    }}
  >

    {Object.keys(staffColumns).map((key) => (

      <label key={key}>

        <input
          type="checkbox"
          checked={staffColumns[key]}
          onChange={() =>
            setStaffColumns({
              ...staffColumns,
              [key]:
                !staffColumns[key]
            })
          }
        />

        {' '}
        {key}

      </label>

    ))}

  </div>
</div>
    
      <h2>
  Saved Projections (Staff Cost):
  {' '}
  SEK
  {' '}
  {totalProjectedBudgetSEK.toFixed(2)}
</h2>

      <table
        border="1"
        cellPadding="8"
        style={{
          borderCollapse:
            'collapse',
          width: '100%'
        }}
      >

        <thead>
          <tr>

  {staffColumns.year &&
    <th>Year</th>}

  {staffColumns.quarter &&
    <th>Quarter</th>}

  {staffColumns.project &&
    <th>Project</th>}

  {staffColumns.resource &&
    <th>Resource</th>}

  {staffColumns.purpose &&
    <th>Purpose</th>}

  {staffColumns.days &&
    <th>Days</th>}

  {staffColumns.hours &&
    <th>Hours</th>}

  {staffColumns.rate &&
    <th>Rate</th>}

  {staffColumns.currency &&
    <th>Currency</th>}

  {staffColumns.fte &&
    <th>FTE</th>}

  {staffColumns.budget &&
    <th>Projected Budget</th>}

  {staffColumns.actions &&
    <th>Actions</th>}

</tr>
        </thead>

        <tbody>

          {filteredProjections.map(
            (item) => {

              const budget =
                item.workDays *
                item.hoursPerDay *
                item.manHourRate *
                item.fteFactor

              return (

                <tr
                  key={item.id}
                >

                {staffColumns.Year &&
                  <td>
                    {item.year}
                  </td>
                }

                {staffColumns.quarter &&
                  <td>
                    {item.quarter}
                  </td>
                }

               {staffColumns.project &&
                  <td>
                    {item.project}
                  </td>
               }

               {staffColumns.resource &&
                  <td>
                    {item.resource}
                  </td>
               }

               {staffColumns.purpose &&
                  <td>
                    {item.purpose}
                  </td>
               }

               {staffColumns.days &&
                  <td>
                    {item.workDays}
                  </td>
               }

               {staffColumns.hours &&
                  <td>
                    {item.hoursPerDay}
                  </td>
               }

               {staffColumns.rate &&
                  <td>
                    {item.manHourRate}
                  </td>
               }

               {staffColumns.currency &&
                  <td>
                    {item.currency}
                  </td>
               }

               {staffColumns.fte &&
                  <td>
                    {item.fteFactor}
                  </td>
               }
   
                {staffColumns.budget &&
                  <td>
                    {budget.toFixed(2)}
                  </td>
                }

                  {staffColumns.actions &&
  <td>

    <button
      onClick={() =>
        handleEdit(item)
      }
    >
      Edit
    </button>

    <button
      onClick={() =>
        handleDelete(item.id)
      }
      style={{
        marginLeft: 5
      }}
    >
      Delete
    </button>

  </td>
}
                </tr>
              )
            }
          )}

        </tbody>

      </table>

    <hr />

<h1>
  Service Cost Projection
</h1>

<h2>
  Add Service Cost Projection
</h2>

<div
  style={{
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, 1fr)',
    gap: 10,
    maxWidth: 900
  }}
>

  <select
    value={serviceYear}
    onChange={(e) =>
      setServiceYear(
        e.target.value
      )
    }
  >
    <option>2025</option>
    <option>2026</option>
    <option>2027</option>
  </select>

  <select
    value={serviceQuarter}
    onChange={(e) =>
      setServiceQuarter(
        e.target.value
      )
    }
  >
    <option>Q1</option>
    <option>Q2</option>
    <option>Q3</option>
    <option>Q4</option>
  </select>

  <input
    placeholder="Project"
    value={serviceProject}
    onChange={(e) =>
      setServiceProject(
        e.target.value
      )
    }
  />

  <input
    placeholder="Purpose"
    value={servicePurpose}
    onChange={(e) =>
      setServicePurpose(
        e.target.value
      )
    }
  />

  <select
    value={serviceCurrency}
    onChange={(e) =>
      setServiceCurrency(
        e.target.value
      )
    }
  >
    <option>SEK</option>
    <option>USD</option>
    <option>EUR</option>
    <option>INR</option>
  </select>

  <input
    type="number"
    placeholder="Projected Budget"
    value={serviceBudget}
    onChange={(e) =>
      setServiceBudget(
        e.target.value
      )
    }
  />

</div>

<br />

<button
  onClick={handleSaveService}
>
  {editingServiceId
    ? 'Update Service Projection'
    : 'Save Service Projection'}
</button>

  <hr />

<h2>
  Saved Projections (Service Cost):
  {' '}
  SEK
  {' '}
  {totalServiceSEK.toFixed(2)}
</h2>

<table
  border="1"
  cellPadding="8"
  style={{
    borderCollapse:
      'collapse',
    width: '100%'
  }}
>

  <thead>
    <tr>
      <th>Year</th>
      <th>Quarter</th>
      <th>Project</th>
      <th>Purpose</th>
      <th>Currency</th>
      <th>Budget</th>
      <th>Budget (SEK)</th>
      <th>Actions</th>
    </tr>
  </thead>

  <tbody>

    {filteredServiceProjections.map(
      (item) => (

        <tr key={item.id}>

          <td>{item.year}</td>

          <td>{item.quarter}</td>

          <td>{item.project}</td>

          <td>{item.purpose}</td>

          <td>{item.currency}</td>

          <td>
            {item.projectedBudget}
          </td>

          <td>
            {
              convertToSEK(
                item.projectedBudget,
                item.currency
              ).toFixed(2)
            }
          </td>

          <td>

            <button
              onClick={() =>
                handleEditService(
                  item
                )
              }
            >
              Edit
            </button>

            <button
              onClick={() =>
                handleDeleteService(
                  item.id
                )
              }
              style={{
                marginLeft: 5
              }}
            >
              Delete
            </button>

          </td>

        </tr>
      )
    )}

  </tbody>

</table>
          
    </div>
  )
}
