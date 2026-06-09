'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  getProjections,
  saveProjection,
  updateProjection,
  deleteProjection
} from '../lib/storage'

export default function ProjectionsPage() {

  const [projections, setProjections] = useState([])

  const [year, setYear] = useState('2026')
  const [quarter, setQuarter] = useState('Q1')
  const [project, setProject] = useState('')
  const [resource, setResource] = useState('')
  const [workDays, setWorkDays] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState('8')
  const [manHourRate, setManHourRate] = useState('')
  const [currency, setCurrency] = useState('SEK')
  const [fteFactor, setFteFactor] = useState('1')

  const [editingId, setEditingId] = useState(null)

  // Filters
  const [filterYear, setFilterYear] = useState('')
  const [filterQuarter, setFilterQuarter] = useState('')
  const [filterProject, setFilterProject] =
    useState('All Projects')

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setProjections(getProjections())
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
    setWorkDays('')
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

      workDays: Number(workDays),
      hoursPerDay: Number(hoursPerDay),

      manHourRate: Number(manHourRate),

      currency,

      fteFactor: Number(fteFactor)
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

  function handleEdit(item) {

    setEditingId(item.id)

    setYear(item.year)
    setQuarter(item.quarter)

    setProject(item.project)
    setResource(item.resource)

    setWorkDays(item.workDays)
    setHoursPerDay(item.hoursPerDay)

    setManHourRate(item.manHourRate)

    setCurrency(item.currency)

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

  const totalProjectedBudget =
    filteredProjections.reduce(
      (sum, p) => {

        return (
          sum +
          (
            p.workDays *
            p.hoursPerDay *
            p.manHourRate *
            p.fteFactor
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

        <input
          placeholder="Resource"
          value={resource}
          onChange={(e) =>
            setResource(
              e.target.value
            )
          }
        />

        <input
          type="number"
          placeholder="Work Days"
          value={workDays}
          onChange={(e) =>
            setWorkDays(
              e.target.value
            )
          }
        />

        <input
          type="number"
          placeholder="Hours Per Day"
          value={hoursPerDay}
          onChange={(e) =>
            setHoursPerDay(
              e.target.value
            )
          }
        />

        <input
          type="number"
          placeholder="Man Hour Rate"
          value={manHourRate}
          onChange={(e) =>
            setManHourRate(
              e.target.value
            )
          }
        />

        <select
          value={currency}
          onChange={(e) =>
            setCurrency(
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
        Saved Projections
        {' '}
        (
        {totalProjectedBudget.toFixed(2)}
        )
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
