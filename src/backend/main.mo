import BlobStorage "blob-storage/Mixin";

persistent actor Backend {
  include BlobStorage();

  public query func ping() : async Text {
    return "ok";
  };
};
