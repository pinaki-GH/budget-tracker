'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  getProjections,
  saveProjection,
  updateProjection,
  deleteProjection,
  getForexRates,
  getResources
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
  const [serviceYear, setServiceYear] = useState(year)
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
  const [filterProject, setFilterProject] =
    useState('All Projects')

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

const totalServiceSEK =
  serviceProjections.reduce(
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
  
  function clearForm() {

    setYear('2026')
    setQuarter('Q1')
    setProject('')
    setResource('')
    setWorkDays(getWorkDaysInQuarter(year, quarter))
    setHoursPerDay('8')
    setManHourRate('')
    setCurrency('SEK')
    setFteFactor('1')

    setEditingId(null)
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
}
  
  function handleEdit(item) {

    setEditingId(item.id)

    setYear(item.year)
    setQuarter(item.quarter)

    setProject(item.project)
    setResource(item.resource)

    setWorkDays(item.workDays)
    // setHoursPerDay(item.hoursPerDay)

    // setManHourRate(item.manHourRate)

    // setCurrency(item.currency)

    setFteFactor(item.fteFactor)
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

  const filteredProjections =
    projections.filter((p) => {

      return (

        (!filterYear ||
          p.year === filterYear) &&

        (!filterQuarter ||
          p.quarter === filterQuarter) &&

        (
          filterProject ===
            'All Projects' ||

          p.project ===
            filterProject
        )
      )
    })

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
        Add Projection
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

      <hr />

      <h2>
  Saved Projections (Staff Cost):
  {' '}
  SEK
  {' '}
  {totalProjectedBudgetSEK.toFixed(2)}
</h2>

  <h2>
  Service Cost Projections
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
            <th>Resource</th>
            <th>Purpose</th>
            <th>Days</th>
            <th>Hours</th>
            <th>Rate</th>
            <th>Currency</th>
            <th>FTE</th>
            <th>Projected Budget</th>
            <th>Actions</th>
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

                  <td>
                    {item.year}
                  </td>

                  <td>
                    {item.quarter}
                  </td>

                  <td>
                    {item.project}
                  </td>

                  <td>
                    {item.resource}
                  </td>

                  <td>
                    {item.purpose}
                  </td>
            
                  <td>
                    {item.workDays}
                  </td>

                  <td>
                    {item.hoursPerDay}
                  </td>

                  <td>
                    {item.manHourRate}
                  </td>

                  <td>
                    {item.currency}
                  </td>

                  <td>
                    {item.fteFactor}
                  </td>

                  <td>
                    {budget.toFixed(2)}
                  </td>

                  <td>

                    <button
                      onClick={() =>
                        handleEdit(
                          item
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
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
            }
          )}

        </tbody>

      </table>

    </div>
  )
}
