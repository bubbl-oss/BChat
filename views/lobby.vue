<template type="x-template" id="lobby-component">
  <div class="container">
    <h3 class="text-center">Hii! Welcome to the lobby!</h3>

    <div class="container">
      <article class="text-center mb-3">
        <div class="row">
          <div class="col-12 col-md-6 offset-md-3">
            <div class="input-group mb-3">
              <input
                type="text"
                class="form-control"
                placeholder="New Room"
                aria-label="New Room"
                aria-describedby="new-room-input"
                v-model="newRoomName"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                id="create-room-btn"
                @click="createRoom()"
                :disabled="!newRoomName"
              >
                Create
              </button>
            </div>
          </div>
          <div class="col-12 col-md-6 offset-md-3">
            <strong class="mb-1 font-monospace" v-if="user">
              nickname: {{ user.nickname }}
            </strong>
            <div class="input-group mb-3">
              <input
                type="text"
                class="form-control"
                placeholder="Change Nickname"
                aria-label="Change Nickname"
                aria-describedby="button-addon2"
                v-model="nickname"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                id="change-nickname-btn"
                @click="changeNickname()"
                :disabled="!nickname"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        <h4>Chat Rooms</h4>
      </article>
      <p>
        {{ rooms[0].users.length }}
      </p>
      <ul class="list-group" v-if="rooms.length > 0">
        <li
          class="list-group-item d-flex justify-content-between"
          v-for="(room, i) in rooms"
          :key="i"
        >
          <router-link :to="`./room/${room.id}`">{{ room.name }}</router-link>
          <div>
            <span> {{ room.users.length }} online &nbsp; </span>
            <button
              class="btn btn-sm btn-success"
              @click="share(room.id, room.name)"
            >
              Share!
            </button>
          </div>
        </li>
      </ul>

      <p class="text-center alert alert-dark" v-else>
        No chat rooms yet, be the first to make one!
      </p>
    </div>

    <footer class="mt-5">
      Bchat

      <a href="https://github.com/bubbl-oss/bchat"
        >Contribute to BChat on Github 🛠️</a
      ><br />
      <a href="https://wa.me/2348140760114?text=hi%20👋🏿" target="_blank"
        >Give us Feedback 👋🏿</a
      >
    </footer>
  </div>
</template>
