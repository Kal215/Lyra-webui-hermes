module.exports = {
  apps: [{
    name: "memory-v2",
    script: "/opt/hermes-stack/memory-core-v2/memory_service.py",
    interpreter: "/opt/hermes-stack/mem0-system/venv/bin/python",
    cwd: "/opt/hermes-stack/memory-core-v2",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "256M",
    env: {
      NODE_ENV: "production"
    }
  }]
}
