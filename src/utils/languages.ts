import { SupportedLanguage, LanguageMeta } from '../types/ide';

export const LANGUAGES: Record<SupportedLanguage, LanguageMeta> = {
  python: {
    id: 'python',
    name: 'Python',
    extension: '.py',
    defaultFileName: 'main.py',
    color: '#38bdf8', // sky-400
    badge: 'Python 3.12',
    compileType: 'interpreted',
    sampleCode: `# Python 3 Script
import math

def calculate_primes(limit):
    primes = []
    for num in range(2, limit + 1):
        is_prime = True
        for i in range(2, int(math.isqrt(num)) + 1):
            if num % i == 0:
                is_prime = False
                break
        if is_prime:
            primes.append(num)
    return primes

print("=== B Code Python IDE ===")
numbers = [10, 25, 42, 88, 99, 105]
print(f"Data set: {numbers}")
print(f"Sum: {sum(numbers)}, Avg: {sum(numbers)/len(numbers):.2f}")

primes = calculate_primes(50)
print(f"Primes up to 50: {primes}")
print("Execution completed successfully.")
`,
  },

  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    defaultFileName: 'script.js',
    color: '#facc15', // yellow-400
    badge: 'Node / V8 JS',
    compileType: 'interpreted',
    sampleCode: `// JavaScript (ES6+ Sandbox)
console.log("=== B Code JavaScript IDE ===");

// 1. Array transformations & reductions
const users = [
  { id: 1, name: "Alice", role: "Frontend Engineer", salary: 135000 },
  { id: 2, name: "Bob", role: "Backend Architect", salary: 160000 },
  { id: 3, name: "Charlie", role: "DevOps Engineer", salary: 142000 },
  { id: 4, name: "Diana", role: "ML Specialist", salary: 175000 }
];

console.log("Active Team Members:");
users.forEach(u => {
  console.log(\`• [\${u.id}] \${u.name} - \${u.role} ($$\{u.salary.toLocaleString()})\`);
});

const totalPayroll = users.reduce((sum, u) => sum + u.salary, 0);
console.log(\`\\nTotal Payroll: $\${totalPayroll.toLocaleString()}\`);
console.log(\`Average Compensation: $\${Math.round(totalPayroll / users.length).toLocaleString()}\`);
`,
  },

  java: {
    id: 'java',
    name: 'Java',
    extension: '.java',
    defaultFileName: 'Main.java',
    color: '#f97316', // orange-500
    badge: 'OpenJDK 21',
    compileType: 'compiled',
    sampleCode: `// Java 21 Application
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== B Code Java IDE ===");
        
        List<String> frameworks = new ArrayList<>();
        frameworks.add("Spring Boot");
        frameworks.add("Hibernate ORM");
        frameworks.add("Micronaut");
        frameworks.add("Quarkus");
        
        System.out.println("Loaded Java Frameworks:");
        for (int i = 0; i < frameworks.size(); i++) {
            System.out.println("  [" + (i + 1) + "] " + frameworks.get(i));
        }
        
        int[] scores = { 92, 85, 99, 78, 94 };
        int sum = 0;
        for (int score : scores) {
            sum += score;
        }
        double average = (double) sum / scores.length;
        
        System.out.println("\\nExam Scores: " + Arrays.toString(scores));
        System.out.println("Mean Score: " + average);
        System.out.println("Process exited with code 0.");
    }
}
`,
  },

  cpp: {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    defaultFileName: 'main.cpp',
    color: '#a855f7', // purple-500
    badge: 'GCC C++20',
    compileType: 'compiled',
    sampleCode: `// C++20 Console Program
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

using namespace std;

int main() {
    cout << "=== B Code C++20 IDE ===" << endl;

    vector<int> numbers = { 64, 25, 12, 22, 11, 90, 45 };
    
    cout << "Initial Vector: ";
    for (int n : numbers) cout << n << " ";
    cout << endl;

    // Sort in ascending order
    sort(numbers.begin(), numbers.end());

    cout << "Sorted Vector:  ";
    for (int n : numbers) cout << n << " ";
    cout << endl;

    int sum = accumulate(numbers.begin(), numbers.end(), 0);
    double avg = static_cast<double>(sum) / numbers.size();

    cout << "Sum: " << sum << ", Average: " << avg << endl;
    cout << "Max Element: " << numbers.back() << endl;

    return 0;
}
`,
  },

  c: {
    id: 'c',
    name: 'C',
    extension: '.c',
    defaultFileName: 'program.c',
    color: '#06b6d4', // cyan-500
    badge: 'GCC C17',
    compileType: 'compiled',
    sampleCode: `// C17 Structured Program
#include <stdio.h>
#include <stdlib.h>

void print_matrix(int rows, int cols, int arr[rows][cols]) {
    for (int i = 0; i < rows; i++) {
        printf("  [ ");
        for (int j = 0; j < cols; j++) {
            printf("%3d ", arr[i][j]);
        }
        printf("]\n");
    }
}

int main() {
    printf("=== B Code C17 IDE ===\n");

    int matrix[3][3] = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
    };

    printf("3x3 Matrix:\n");
    print_matrix(3, 3, matrix);

    int trace = 0;
    for (int i = 0; i < 3; i++) {
        trace += matrix[i][i];
    }
    printf("Matrix Trace (diagonal sum): %d\n", trace);

    return 0;
}
`,
  },

  sql: {
    id: 'sql',
    name: 'SQL (MySQL)',
    extension: '.sql',
    defaultFileName: 'queries.sql',
    color: '#10b981', // emerald-500
    badge: 'MySQL 8.0 Engine',
    compileType: 'relational',
    sampleCode: `-- MySQL Database Script
-- B Code in-browser MySQL Relational Sandbox

-- 1. Create employees schema table
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    department VARCHAR(50),
    salary DECIMAL(10, 2),
    hire_date VARCHAR(10)
);

-- 2. Insert records
INSERT INTO employees VALUES (101, 'Elena Rostova', 'Engineering', 145000.00, '2023-01-15');
INSERT INTO employees VALUES (102, 'Marcus Vance', 'Engineering', 138000.00, '2022-06-01');
INSERT INTO employees VALUES (103, 'Aria Montgomery', 'Design', 125000.00, '2023-03-20');
INSERT INTO employees VALUES (104, 'David Kim', 'Product', 152000.00, '2021-11-10');
INSERT INTO employees VALUES (105, 'Samantha Green', 'Engineering', 160000.00, '2020-04-12');
INSERT INTO employees VALUES (106, 'Julian Thorne', 'Design', 118000.00, '2023-08-05');

-- 3. Query all high earners in Engineering
SELECT id, name, department, salary 
FROM employees 
WHERE salary > 130000 AND department = 'Engineering'
ORDER BY salary DESC;

-- 4. Calculate departmental metrics
SELECT department, COUNT(*) AS employee_count, AVG(salary) AS avg_salary, MAX(salary) AS max_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
`,
  },
};

export function detectLanguage(fileName: string): SupportedLanguage {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'py':
    case 'python':
      return 'python';
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return 'javascript';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
      return 'cpp';
    case 'c':
    case 'h':
      return 'c';
    case 'sql':
    case 'mysql':
      return 'sql';
    default:
      return 'python';
  }
}

export function getDefaultExtension(lang: SupportedLanguage): string {
  return LANGUAGES[lang]?.extension || '.txt';
}

export function getDefaultComment(lang: SupportedLanguage): string {
  switch (lang) {
    case 'python':
      return '# code here\n';
    case 'javascript':
      return '// code here\n';
    case 'java':
      return '// code here\n';
    case 'cpp':
      return '// code here\n';
    case 'c':
      return '// code here\n';
    case 'sql':
      return '-- code here\n';
    default:
      return '// code here\n';
  }
}
