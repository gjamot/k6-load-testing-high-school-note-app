import { sleep, check } from 'k6';
import { Options } from 'k6/options';
import http from 'k6/http';
import type { StudentInfo } from './types/StudentInfo';

export let options:Options = {
  scenarios: {
    
    constant_vus_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      gracefulStop: '0s', // do not wait for iterations to finish in the end
      tags: { test_type: 'constant_vus_test' }, // extra tags for the metrics generated by this scenario
      exec: 'createAndUpdateScenario', // the function this scenario will execute
    },
    constant_arrival_rate_test: {
      executor: 'constant-arrival-rate',
      rate: 90,
      timeUnit: '1m', // 90 iterations per minute, i.e. 1.5 RPS
      duration: '5m',
      preAllocatedVUs: 10, // the size of the VU (i.e. worker) pool for this scenario
      tags: { test_type: 'constant_arrival_rate_test' }, // different extra metric tags for this scenario
      exec: 'fetchScenario', // this scenario is executing different code than the one above!
    },
    ramping_arrival_rate_test: {
      executor: 'ramping-arrival-rate',
      startTime: '30s', // the ramping API test starts a little later
      startRate: 50,
      timeUnit: '1s', // we start at 50 iterations per second
      stages: [
        { target: 100, duration: '30s' }, // go from 50 to 200 iters/s in the first 30 seconds
        { target: 100, duration: '3m30s' }, // hold at 200 iters/s for 3.5 minutes
        { target: 0, duration: '30s' }, // ramp down back to 0 iters/s over the last 30 second
      ],
      preAllocatedVUs: 50, // how large the initial pool of VUs would be
      maxVUs: 100, // if the preAllocatedVUs are not enough, we can initialize more
      tags: { test_type: 'ramping_arrival_rate_test' }, // different extra metric tags for this scenario
      exec: 'fetchScenario', // same function as the scenario above, but with different env vars
    },
  },
  discardResponseBodies: true,
  thresholds: {
    'http_req_duration{scenario:constant_vus_test}': ['p(99)<1500'],
    'http_req_duration{scenario:constant_arrival_rate_test}': ['p(99)<1500'],
    'http_req_duration{scenario:ramping_arrival_rate_test}': ['p(99)<1500'],
  },
};

export function createAndUpdateScenario() {
  createStudent();
  updateStudent();
  sleep(Math.random() * 2);
}

export function fetchScenario() {
  getStudents();
  getClasses();
}

export function createStudent() {
  const newStudent = {
    firstName: "FirstName",
    lastName: "LastName",
    sex: "NG"
  } as StudentInfo;

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  
  const res = http.post(`${__ENV.BASE_URL}/api/students`, JSON.stringify(newStudent), params);
  check(res, {
    "status is 200": () => res.status === 200,
  });
};

export function updateStudent() {
  const newStudentData = {
    firstName: "FirstNameUpdated",
    lastName: "LastNameUpdated",
    sex: "NG"
  } as StudentInfo;

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.put(`${__ENV.BASE_URL}/api/students/1`, JSON.stringify(newStudentData), params);
  check(res, {
    "status is 200": () => res.status === 200,
  });
};

export function getStudents() {
  const res = http.get(`${__ENV.BASE_URL}/api/students`);
  check(res, {
    "status is 200": () => res.status === 200,
  });
};

export function getClasses() {
  const res = http.get(`${__ENV.BASE_URL}/api/classes`);
  check(res, {
    "status is 200": () => res.status === 200,
  });
};
